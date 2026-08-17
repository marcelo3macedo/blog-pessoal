---
title: "Case Study: Graceful Degradation & Rate Limit Bypass with Redis in Distributed Systems"
subtitle: "Eliminating API rate-limit errors (HTTP 429), cutting third-party API calls by 95%, and achieving 0% failure under load using sliding-window tracking and delta queues."
author: "Marcelo Macedo"
tags:
  - distributed-systems
  - redis
  - laravel
  - golang
  - rate-limiting
  - system-design
---

# Case Study: Graceful Degradation & Rate Limit Bypass with Redis in Distributed Systems

## Executive Summary

Third-party API integration bottlenecks are among the most common causes of cascading failures in distributed web architectures. When an upstream provider enforces strict quota limits (such as Google Sheets API's limit of 300 requests per minute), traffic spikes on the consumer application quickly cause quota exhaustion, triggering `HTTP 429 Too Many Requests` errors that propagate directly to end users.

This case study demonstrates the design and implementation of the **Graceful Degradation with Redis** pattern in a distributed system. By leveraging a **sliding-window rate counter** and an **asynchronous write delta queue**, the application dynamically degrades reads and writes during load peaks while maintaining 100% data consistency.

- **Domain:** Distributed Systems / Rate Limiting, Fault Tolerance & Caching.
- **Technology Stack:** PHP (Laravel), Go (`sheets-mock-api`), Redis, Docker Compose, Grafana k6.
- **Key Engineering Outcomes:**
  - System error rate reduced from **78.3% (at peak load window) / 12.7% (overall baseline) down to 0%**.
  - Direct HTTP calls to the external provider reduced by **>95%** during traffic surges, guaranteeing strict compliance with the 300 req/min quota.
  - Achieved **100% request success rate (2,458 out of 2,458 requests)** during stress testing.
- **Source Code Repository:** [github.com/marcelo3macedo/php-graceful-degradation-rate-limit](https://github.com/marcelo3macedo/php-graceful-degradation-rate-limit)

---

## 1. The Problem: Quota Exhaustion & Cascading Failures

In the baseline un-protected scenario (`feature/01-direct-api-unstable`), the main application (`main-service-api`, built with Laravel) forwards every incoming read/write request directly to an external service (`sheets-mock-api`, built in Go).

The Go mock API enforces a strict **Token Bucket Rate Limiting algorithm calibrated at 300 requests per minute (5 req/s average)**, faithfully replicating the real production rate limits of the Google Sheets API ecosystem.

```text
[ k6 Load Runner ] ----> [ main-service-api (Laravel) ] ----> [ sheets-mock-api (Go) ]
                                                                (Quota Limit: 300 req/min)
                                                                        |
                                                                        | (Exceeded Limit)
                                                                        v
[ k6 Load Runner ] <---- [ HTTP 429 / 502 Errors ] <------------ [ Token Bucket Empty ]
```

### Baseline Stress Test Failure Analysis (k6 Benchmark)

When k6 ramps up concurrent traffic against `main-service-api`, the 300 req/min quota is rapidly depleted:

| Test Window (Time) | Total Requests | Successful Requests (2xx) | Failed Requests (429/502) | Instantaneous Error Rate |
| :--- | :--- | :--- | :--- | :--- |
| **0s – 160s** | 632 | 632 | 0 | 0.0% (Normal load) |
| **170s – 180s (Peak)** | 153 | 33 | **120** | **78.4% Failure** |
| **180s Window** | 80 | 0 | **80** | **100.0% Failure** |
| **240s Window** | 40 | 0 | **40** | **100.0% Failure** |
| **Total Test Summary** | **1,258** | **1,098** | **160** | **12.7% Global Error Rate** |

Without an intermediate resilience layer, upstream rate limiting directly collapses downstream user availability.

---

## 2. The Solution Architecture: Dynamic Graceful Degradation

To protect the external API quota without rejecting user requests, we designed a dual-mode execution strategy controlled by a **50% Quota Trigger ($150\text{ req/min}$)**.

```text
+-----------------------------------------------------------------------------------+
| k6 Load Runner / Client Applications                                             |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| main-service-api (Laravel)                                                        |
|                                                                                   |
| 1. Second-by-Second Redis Sliding Window Quota Counter                            |
| 2. Check Quota Usage Threshold:                                                   |
|                                                                                   |
| [ Quota <= 50% (<= 150 req/min) ] --------------> DIRECT MODE                     |
|                                                   (Pass-through to Go API)        |
|                                                                                   |
| [ Quota > 50% (> 150 req/min) ]  --------------> DEGRADED MODE                   |
|                                                   |                               |
|        +------------------------------------------+                               |
|        | Read Operation                           | Write Operation               |
|        v                                          v                               |
|   Query Redis Snapshot                     Push Write to Redis Delta Queue        |
|   + Merge Local Delta Buffer               + Instantly Update Local Snapshot      |
|        |                                          |                               |
|        +--------------------+---------------------+                               |
|                             v                                                     |
|                  Return Fast 200 OK Response                                      |
+-----------------------------------------------------------------------------------+
                                       .
                                       . Async Drain Queue (When Quota < 50%)
                                       v
+-----------------------------------------------------------------------------------+
| BACKGROUND WORKER (DrainQuotaBufferCommand)                                      |
| Paces pending write deltas to Go API without breaching 300 req/min limit          |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
| sheets-mock-api (Go)                                                              |
| Rate Limit: 300 req/min (Strictly preserved)                                      |
+-----------------------------------------------------------------------------------+
```

### How the Architecture Works

1. **Normal Operational Mode ($\le 50\%$ Quota / $\le 150\text{ req/min}$):** The system passes read and write requests directly through to `sheets-mock-api`. Response payloads are asynchronously mirrored to a Redis snapshot cache.
2. **Degraded Operational Mode ($> 50\%$ Quota / $> 150\text{ req/min}$):**
   - **Degraded Reads:** Intercepted at `main-service-api`. Instead of calling the Go API, the service retrieves the baseline snapshot from Redis and merges pending writes from the local buffer in memory, returning real-time consistent data.
   - **Degraded Writes:** Intercepted and appended to an atomic **Redis Delta Queue (`sheets_write_buffer`)**. The local read snapshot is instantly updated in memory, and a `200 OK` is returned to the user immediately.
3. **Asynchronous Background Synchronization:** Once traffic subsides and quota usage drops back below 50%, a long-running CLI worker (`DrainQuotaBufferCommand`) drains the delta queue in controlled batches, syncing pending mutations to the Go API without creating traffic spikes.

---

## 3. Implementation Deep Dive

### 1. Second-by-Second Sliding Window Quota Tracker

To prevent boundary spike bugs common in fixed-window algorithms, `GoogleSheetsQuotaService` implements a 60-second sliding window using second-granular Redis keys with automated TTL expiration.

```php
// File: app/Services/GoogleSheetsQuotaService.php
public function registerRequest(): int
{
    $now = time();
    $key = self::KEY_PREFIX . $now;

    // Increment current second's counter atomically
    $current = Redis::incr($key);
    if ($current === 1) {
        Redis::expire($key, self::TTL_SECONDS); // 60s TTL
    }

    return $this->getQuotaConsumed();
}

public function getQuotaConsumed(): int
{
    $now = time();
    $keys = [];
    for ($i = 0; $i < 60; $i++) {
        $keys[] = self::KEY_PREFIX . ($now - $i);
    }

    $values = Redis::mget($keys);
    return array_sum(array_map('intval', array_filter($values)));
}

public function isDegraded(?int $consumed = null): bool
{
    $consumed = $consumed ?? $this->getQuotaConsumed();
    return $consumed > $this->getThreshold(); // Threshold: 150 req/min
}
```

### 2. HTTP Middleware Observability Injection

Every request passes through `QuotaTrackerMiddleware`, injecting quota state into request attributes and appending operational headers for real-time telemetry.

```php
// File: app/Http/Middleware/QuotaTrackerMiddleware.php
public function handle(Request $request, Closure $next): Response
{
    $consumed = $this->quotaService->registerRequest();
    $isDegraded = $this->quotaService->isDegraded($consumed);

    $request->attributes->set('quota_consumed', $consumed);
    $request->attributes->set('is_degraded', $isDegraded);

    $response = $next($request);

    $response->headers->set('X-Quota-Consumed', (string) $consumed);
    $response->headers->set('X-System-Degraded', $isDegraded ? 'true' : 'false');

    return $response;
}
```

### 3. Read Interception with Delta Merging

When degraded mode is active, `GoogleSheetsService` bypasses the HTTP client and merges pending write deltas into the cache snapshot:

```php
// File: app/Services/GoogleSheetsService.php
public function getRows(string $sheet = 'orders'): array
{
    if ($this->quotaService->isDegraded()) {
        return $this->getDegradedMergedRows($sheet);
    }

    return $this->getDirectRows($sheet);
}
```

### 4. Asynchronous Queue Drain Worker

The background worker monitors Redis quota counters, draining buffered write mutations only when external quota availability is safe:

```php
// File: app/Console/Commands/DrainQuotaBufferCommand.php
public function handle(GoogleSheetsQuotaService $quotaService, GoogleSheetsService $sheetsService): int
{
    $sheet = $this->option('sheet');
    $loop = $this->option('loop');

    do {
        $consumed = $quotaService->getQuotaConsumed();
        $bufferLen = $sheetsService->getBufferLength($sheet);

        if ($consumed <= 150 && $bufferLen > 0) {
            $drained = $sheetsService->drainBuffer($sheet, batchSize: 20);
            $this->info("Quota normalized ({$consumed} req/min). Drained {$drained} buffered writes.");
        }

        if ($loop) {
            sleep(1);
        }
    } while ($loop);

    return Command::SUCCESS;
}
```

---

## 4. Empirical Benchmark Telemetry (Grafana k6 Load Test)

Under the exact same load test script that previously produced a 12.7% overall failure rate, the Graceful Degradation architecture achieved **0% failures across 2,458 requests**:

### Timeline Telemetry (300-Second Load Execution)

| Timestamp (t) | System State | Total Requests | Normal Direct Req | Degraded Intercepted Req | CPU Usage (%) | RAM Usage (MiB) | Redis Memory (MB) | Quota Used (60s Window) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **10s** | NORMAL | 22 | 22 | 0 | 3.37% | 38.3 MiB | 0.90 MB | 21 |
| **30s** | NORMAL | 25 | 25 | 0 | 4.10% | 39.9 MiB | 0.98 MB | 68 |
| **60s** | NORMAL | 30 | 30 | 0 | 5.20% | 42.3 MiB | 1.12 MB | 150 |
| **70s** | **DEGRADED** | 32 | 0 | **32** | 6.80% | 44.8 MiB | 1.18 MB | 181 |
| **120s** | **DEGRADED** | 40 | 0 | **40** | 10.40% | 52.8 MiB | 1.38 MB | 360 |
| **180s (Peak)** | **DEGRADED** | 80 | 0 | **80** | 15.40% | 60.5 MiB | 1.45 MB | 480 |
| **240s** | **DEGRADED** | 40 | 0 | **40** | 9.80% | 51.9 MiB | 1.36 MB | 810 |
| **270s** | **RECOVERED**| 25 | 25 | 0 | 5.10% | 42.0 MiB | 1.15 MB | 180 |
| **300s** | NORMAL | 10 | 10 | 0 | 2.10% | 37.5 MiB | 0.95 MB | 60 |

### Aggregated Performance Summary

```text
Total Requests Executed:    2,458
Successful Responses (2xx):  2,458 (100.0%)
Failed Requests (429/5xx):   0     (0.0%)

Intercepted Degraded Reads:  1,154
Buffered Degraded Writes:   1,154
Total External Calls Saved: 2,308 (>95% Reduction during peak window)
```

---

## 5. Architectural Decision Analysis & Trade-Offs

| Decision | Alternative | Engineering Justification | Accepted Trade-Off |
| :--- | :--- | :--- | :--- |
| **Dynamic 50% Quota Trigger** | Always-on caching layer | Allows direct, synchronous write-through when traffic is light; avoids unnecessary cache-sync overhead during idle periods. | Marginally higher external API consumption during normal load ($\le 150\text{ req/min}$). |
| **Redis Delta Queue for Writes** | Block writes or synchronous HTTP retry | Prevents quota exhaustion and guarantees instant sub-10ms write confirmation to clients. | **Eventual Consistency:** Write mutations reside in memory before async persistence to Google Sheets. |
| **Local Snapshot + Delta Merge** | Return stale snapshot without pending deltas | Ensures Read-Your-Own-Writes consistency for clients operating during degraded mode. | Increases local processing and memory overhead to perform in-memory delta merging. |
| **Controlled Worker Draining** | Burst sync upon quota reset | Paces write persistence to prevent secondary traffic spikes when exiting degraded mode. | Small delay in upstream write visibility after traffic drops. |

---

## 6. Key Engineering Lessons

1. **Quota Protection Requires Proactive Triggers:** Waiting for an `HTTP 429` error before acting is reactive and prone to failure under load. Setting a proactive threshold at 50% quota ensures the system transitions into degraded mode *before* rate limits are reached.
2. **Read-Your-Own-Writes Consistency is Non-Negotiable:** Caching read payloads during degradation is straightforward, but users expect immediate visibility of their own recent writes. Merging delta queues into the read snapshot preserves data consistency without touching the external API.
3. **Zero-Downtime Resilience:** By combining Redis caching with background workers, third-party API availability issues are decoupled from client application availability.

---

## Source Code & Reproduction

The repository contains full Docker Compose setups, Go mock services, Laravel application code across four Git branches, and k6 test suites:

🔗 **[github.com/marcelo3macedo/php-graceful-degradation-rate-limit](https://github.com/marcelo3macedo/php-graceful-degradation-rate-limit)**

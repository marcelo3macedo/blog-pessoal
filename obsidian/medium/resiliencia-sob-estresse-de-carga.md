---
title: "Case Study: Resilience Under Load Stress — Comparing Circuit Breaker, Retry, and Bulkhead Patterns in Node.js Microservices"
subtitle: "How applying resilient design patterns cut p(95) latency by 14x (3005ms to 204ms) and boosted throughput by 53% during upstream container OOM crash-loops."
author: "Marcelo Macedo"
tags:
  - microservices
  - nodejs
  - resilience
  - circuit-breaker
  - system-design
  - software-architecture
---

# Case Study: Resilience Under Load Stress — Comparing Circuit Breaker, Retry, and Bulkhead Patterns in Node.js Microservices

## Executive Summary

In microservice architectures, an unhandled partial failure in an upstream dependency frequently triggers cascading system outages. When a downstream service encounters performance degradation or memory leaks, caller services that lack fault-tolerance protection accumulate hanging sockets, exhaust Event Loop threads, and eventually crash.

This case study presents an empirical analysis of resilience engineering in Node.js microservices under load. We simulate a severe upstream memory leak in a `payment-service` that forces the container into an OOM (Out-Of-Memory) kill and crash-loop cycle under sustained traffic. We then trace how the calling `order-service` evolved across four Git branches by introducing **Retry with Exponential Backoff and Jitter**, **Circuit Breakers**, and **Bulkhead Isolation**.

- **Domain:** Distributed Systems / Microservice Fault Tolerance.
- **Technology Stack:** Node.js (Express), Docker Compose, Grafana k6.
- **Key Engineering Results:**
  - $p(95)$ Latency reduced **14x (from 3,005 ms down to 204 ms)**.
  - Overall request throughput increased by **53% (8.16 req/s to 12.56 req/s)**.
  - Implemented a **Fail-Fast architecture** that rejects calls early during upstream failure, protecting Node.js Event Loop memory and CPU.
- **Source Code Repository:** [github.com/marcelo3macedo/node-microservices-resilience-patterns](https://github.com/marcelo3macedo/node-microservices-resilience-patterns)

---

## 1. The Challenge: Upstream Memory Leaks & OOM Crash-Loops

In our test setup, the `order-service` handles client order requests by invoking the `payment-service` over synchronous HTTP.

To create an authentic failure environment, the `payment-service` incorporates a intentional memory leak. Every incoming request allocates and retains a binary buffer in memory. Under sustained load, the container's Resident Set Size (RSS) memory grows continuously until it breaches Docker's 256MB container memory limit, triggering an **OOM Kill (Exit Code 137)** followed by an automatic container restart (`restart: on-failure`).

```text
[ k6 Load Runner ] ----> [ order-service (Node.js) ] ----> [ payment-service (Node.js) ]
                             (Port :3000)                      (Port :3001)
                                                                    |
                                                                    | (Unhandled Memory Leak)
                                                                    v
                                                            +-----------------------+
                                                            | RSS RAM: 60MB->256MB  |
                                                            | OOM-Kill (Exit 137)   |
                                                            | Docker Auto-Restart   |
                                                            +-----------------------+
```

### Empirical Memory Leak Telemetry (`payment-service` RSS RAM)

During a 42-second load run, the `payment-service` undergoes two full memory crash cycles:

| Timestamp (t) | Container RAM (MiB) | Container Status | Operational State |
| :--- | :--- | :--- | :--- |
| **t = 2s – 5s** | ~60 MiB | Healthy | Processing incoming requests normally. |
| **t = 10s** | 71.25 MiB | Memory Climbing | Buffer allocations accumulating in RSS. |
| **t = 15s** | 122.00 MiB | Degrading | Heavy Garbage Collection overhead. |
| **t = 20s** | 212.30 MiB | Severe Stress | Event Loop delay spiking; responses timing out (>3s). |
| **t = 25s – 30s**| ~250 MiB | Memory Ceiling | **Container hits 256MB memory cap.** |
| **t = 31s** | **27.27 MiB** | **OOM-Killed & Restarted** | Docker kills process (Code 137); process restarts. |
| **t = 35s** | 106.60 MiB | Leak Cycle #2 | Memory climbing rapidly under active load. |
| **t = 40s – 42s**| ~251 MiB | Near Death #2 | Pre-OOM stress repeated. |

### Baseline Failure Metrics (`01-base-service-unstable`)

In the unprotected base scenario, `order-service` invokes `payment-service` with a simple 3-second HTTP timeout:
- **Total Executed Requests:** 286
- **Throughput:** 8.16 req/s
- **HTTP Error Rate:** **16.43%** (1 out of 6 orders timed out)
- **Latency Benchmarks:** Median $p(50) = 33.11\text{ ms}$, **$p(95) = 3,004.54\text{ ms}$**

During the 10-second window leading up to an OOM-kill, hanging requests fill the Node.js socket pool, causing severe latency degradation.

---

## 2. Architecture Evolution & Protective Patterns

Across four evolutionary branches, `order-service` was upgraded with stacked resilience layers:

```text
+-----------------------------------------------------------------------------------+
| k6 Load Runner / Client Applications                                             |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| order-service (Protected Architecture)                                             |
|                                                                                   |
|  [ Layer 1: Retry + Jitter ]                                                      |
|        |                                                                          |
|        v                                                                          |
|  [ Layer 2: Circuit Breaker ] ---- (Circuit OPEN?) ----> [ Fail Fast (HTTP 503) ]  |
|        |                                                                          |
|        v                                                                          |
|  [ Layer 3: Bulkhead Concurrency Guard ] -- (Full?) ---> [ Reject (HTTP 503) ]    |
|        |                                                                          |
+--------|--------------------------------------------------------------------------+
         |
         v (Allowed HTTP Request)
+-----------------------------------------------------------------------------------+
| payment-service (Node.js)                                                         |
+-----------------------------------------------------------------------------------+
```

### Branch Evolution & Feature Matrix

| Branch | Pattern Implemented | Mechanism Summary |
| :--- | :--- | :--- |
| `feature/01-base-service-unstable` | None (Unprotected) | Direct HTTP call with static 3s timeout. |
| `feature/02-pattern-retry-backoff` | **Retry + Backoff + Jitter** | Retries failed calls up to 3 times with randomized exponential backoff. |
| `feature/03-pattern-circuit-breaker` | **Circuit Breaker** | Tracks failure rates; opens circuit to fail fast when `payment-service` degrades. |
| `feature/04-pattern-bulkhead-isolation` | **Bulkhead Concurrency Guard** | Caps maximum concurrent HTTP calls, protecting the Node.js Event Loop. |

---

## 3. Implementation Code Deep Dive

### 1. Retry with Exponential Backoff & Jitter

Jitter adds randomness to backoff intervals, preventing synchronized retry storms when the upstream container finishes restarting:

```javascript
// File: order-service/utils/retry.js
function backoffDelay(attempt, baseDelayMs, maxDelayMs) {
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  return Math.random() * exponential; // Full jitter
}

async function executeWithRetry(fn, options = {}) {
  const { maxAttempts = 3, baseDelayMs = 100, maxDelayMs = 1000 } = options;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fn();
      if (response.ok || !isRetryableStatus(response.status) || attempt === maxAttempts - 1) {
        return response;
      }
    } catch (err) {
      if (attempt === maxAttempts - 1) throw err;
    }
    const delay = backoffDelay(attempt, baseDelayMs, maxDelayMs);
    await sleep(delay);
  }
}
```

### 2. State Machine Circuit Breaker

The Circuit Breaker operates a state machine (`CLOSED` $\rightarrow$ `OPEN` $\rightarrow$ `HALF_OPEN`). While in the `OPEN` state, calls fail instantly (`503 Service Unavailable`) without attempting HTTP execution:

```javascript
// File: order-service/utils/circuit-breaker.js
class CircuitBreaker {
  canAttempt() {
    if (this.state !== STATE.OPEN) return true;
    
    // Check if recovery window (1500ms) has elapsed
    if (Date.now() - this.openedAt >= this.openDurationMs) {
      this.state = STATE.HALF_OPEN;
      return true;
    }
    return false; // Fail fast immediately
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = STATE.CLOSED;
  }

  onFailure() {
    this.failureCount += 1;
    if (this.state === STATE.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this.state = STATE.OPEN;
      this.openedAt = Date.now();
    }
  }
}
```

### 3. Bulkhead Concurrency Guard

The Bulkhead restricts the maximum number of simultaneous requests sent to `payment-service`. Excess requests are immediately rejected rather than filling memory:

```javascript
// File: order-service/utils/bulkhead.js
class Bulkhead {
  constructor(maxConcurrent = 10, maxQueue = 0) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueue = maxQueue;
    this.active = 0;
    this.queue = [];
  }

  async run(fn) {
    if (this.active >= this.maxConcurrent) {
      if (this.queue.length >= this.maxQueue) {
        throw new BulkheadRejectedError(
          `Bulkhead "${this.name}" full (${this.active}/${this.maxConcurrent} active)`
        );
      }
      await new Promise((resolve) => this.queue.push(resolve));
    }

    this.active += 1;
    try {
      return await fn();
    } finally {
      this.active -= 1;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next();
      }
    }
  }
}
```

---

## 4. Empirical Benchmark Telemetry & Comparison

### Overall Performance Across Branches

Data collected from full k6 load executions across each evolutionary branch:

| Metric | Branch 01 (Base) | Branch 02 (Retry) | Branch 03 (Circuit Breaker) | Branch 04 (Bulkhead) |
| :--- | :--- | :--- | :--- | :--- |
| **Total Requests** | 286 | 388 | **459** | 443 |
| **Throughput (req/s)** | 8.16 | 11.03 | **13.00** | 12.56 |
| **Error Rate (%)** | 16.43% | **2.58%** | 7.84% | 7.00% |
| **p(50) Latency** | 33.11 ms | 16.70 ms | **11.73 ms** | 16.08 ms |
| **p(90) Latency** | 3,002.77 ms | 467.80 ms | 196.96 ms | **105.03 ms** |
| **p(95) Latency** | 3,004.54 ms | 1,148.36 ms | 399.79 ms | **204.89 ms** |
| **Max Latency** | 3,034.73 ms | 2,432.52 ms | **1,370.63 ms** | 2,561.69 ms |

### Successful vs. Failed Orders

| Branch | Successful Orders (HTTP 201) | Failed Orders (HTTP 502/503) | Total Orders |
| :--- | :--- | :--- | :--- |
| **01 — Base** | 239 | 47 | 286 |
| **02 — Retry** | 378 | **10** | 388 |
| **03 — Circuit Breaker** | **423** | 36 | 459 |
| **04 — Bulkhead** | 412 | 31 | 443 |

### Interception Breakdown in Branch 04 (Layered Interceptions)

In the final branch, distinct resilience mechanisms handled different failure states:

| Mechanism Triggered | Trigger Event Count | Resulting System Behavior |
| :--- | :--- | :--- |
| **Bulkhead Immediate Rejection** | 19 events | Returned `503` instantly due to concurrent connection cap. |
| **Circuit Breaker Fail-Fast** | 5 events | Returned `503` instantly while circuit was `OPEN`. |
| **Retry Attempts Fired** | 11 events | Retried transient errors, successfully resolving 16 calls post-restart. |

---

## 5. Decision Analysis & Counter-Intuitive Insights

### Why Did the Error Rate Increase in Circuit Breaker / Bulkhead Branches?

A common question when analyzing the telemetry is why the raw error rate rose from **2.58% (Retry branch)** to **7.00% – 7.84% (Circuit Breaker & Bulkhead branches)**.

**This is expected design behavior, not a performance regression:**

1. **Holding Connections vs. Failing Fast:** The Retry pattern holds client requests waiting in memory while retrying. During an extended container restart, these requests accumulate latency (up to 2,400 ms) before failing.
2. **Fail-Fast Protection:** The Circuit Breaker and Bulkhead reject excess requests **immediately (in $<5\text{ ms}$)** when the target service is failing or overwhelmed.
3. **The Benefit:** While raw rejected requests increase slightly, **$p(95)$ latency plummets from 1,148 ms down to 204 ms**, freeing up CPU and memory on `order-service` to serve healthy traffic.

In high-throughput systems, **failing fast to preserve overall cluster health is far superior to holding connections indefinitely to save isolated requests**.

### Max Latency Nuance: Circuit Breaker vs. Bulkhead

- **Circuit Breaker Max Latency (1,370 ms):** When the failure threshold is hit, the circuit opens and trips *all* subsequent requests instantly, capping maximum latency.
- **Bulkhead Max Latency (2,561 ms):** The Bulkhead allows up to 10 requests to pass through concurrently. The 11th request fails fast ($<5\text{ ms}$), but the 10 allowed requests still wait on the slow, memory-starved `payment-service`, driving the isolated maximum latency higher.

---

## 6. Key Engineering Lessons

1. **Retry + Automatic Container Restarts Work Together:** Out of 26 failed initial calls in the Retry branch, 16 succeeded because the retry attempt coincided with Docker completing the container restart. Retry mechanisms require fast upstream recovery to be effective.
2. **Never Optimize Raw Error Rate in Isolation:** Reducing errors by hanging requests harms total throughput and degrades overall system latency. Optimize for $p(95)/p(99)$ latency and cluster stability.
3. **Layered Defense (Defense in Depth):** Combining Retry (transient errors), Circuit Breaker (sustained outages), and Bulkhead (concurrency protection) provides total resilience against complex failure modes.

---

## Source Code & Reproduction

The complete open-source project, including all four Git branches, Docker Compose configurations, and Grafana k6 scripts, is available at:

🔗 **[github.com/marcelo3macedo/node-microservices-resilience-patterns](https://github.com/marcelo3macedo/node-microservices-resilience-patterns)**

---
title: "Demonstrating Resilience in Microservices with Circuit Breaker and Guaranteed Delivery"
category: arquitetura
project: tcc-tolerancia-falhas-microsservicos
excerpt: "Distributed systems inevitably face failures. Unavailability of external services, network latency, infrastructure overload, and temporary errors are all part of the reality of any production environment."
slug: demonstrating-resilience-in-microservices-with-circuit-breaker
published_at: 2026-06-25
tags:
  - architecture
  - circuit-breaker
  - resilience
seo_title: "Demonstrating Resilience in Microservices with Circuit Breaker and Guaranteed Delivery"
seo_description: "Distributed systems inevitably face failures. Unavailability of external services, network latency, infrastructure overload, and temporary errors are all part of the reality of any production environment."
seo_keywords:
  - architecture
  - circuit-breaker
  - resilience
---

# Demonstrating Resilience in Microservices with Circuit Breaker and Guaranteed Delivery

Distributed systems inevitably face failures.

Unavailability of external services, network latency, infrastructure overload, and temporary errors are all part of the reality of any production environment.

For this reason, modern microservices architectures need to be designed with the assumption that failures will happen.

The goal is not to avoid failures, but to ensure the system keeps operating even when part of its components run into trouble.

This project was built to demonstrate fundamental resilience concepts using:

- Node.js    
- Docker Compose    
- RabbitMQ    
- Circuit Breaker    
- Dead Letter Queue (DLQ)    
- Automatic retries    
- Asynchronous processing
    

The scenario simulates an order platform where one service receives requests and another processes payments through an external integration prone to failures.

Even in the face of errors, slowness, or temporary unavailability of the external provider, the system keeps operating and guarantees that no order is lost.

Source code:
- https://github.com/marcelo3macedo/alem-do-script/tree/main/comunicacao-microservicos-com-circuit-breaker

---

# Goal of the Demonstration

The proposal is to demonstrate how microservices can keep operating by combining a few widely used architectural patterns.

During the simulation run it's possible to observe:

- Asynchronous communication between services    
- Decoupling through queues    
- Circuit Breaker protecting unstable integrations    
- Automatic message re-queueing    
- Dead Letter Queue    
- Automatic retries    
- Guaranteed delivery    
- Automatic recovery after failures
    
---

# Solution Architecture

The architecture was built using independent services that communicate exclusively through queues.

```text
Orders Service
      ↓
RabbitMQ
      ↓
Payments Service
      ↓
External Gateway
```

The orders service has no direct dependency on the payments service whatsoever.

This means that even if payment processing is unavailable, orders keep being accepted and stored in the queue.

---

# Orders Service

Responsible for receiving orders.

Example:

```json
{
  "orderId": "123",
  "amount": 150.00
}
```

Upon receiving the order:

1. Validates the data.    
2. Publishes the message to the queue.    
3. Returns success to the client.
    

The actual processing happens afterward.

---

# RabbitMQ

RabbitMQ acts as the decoupling layer.

Its role is to:
- Store messages    
- Guarantee delivery    
- Enable retries    
- Absorb load spikes
    
Even if the payments service is temporarily unavailable, messages remain stored.

---

# Payments Service

Responsible for consuming orders and processing payments.

Flow:

```text
Queue
   ↓
Consumer
   ↓
External Gateway
   ↓
Result
```

This is exactly where the simulated failures happen.

---

# Simulating Instability

To represent situations common in real environments, an external service with a configurable failure rate was created.

Examples:

```text
70% failure rate
```

or

```text
5% failure rate
```

This makes it possible to observe how the architecture behaves under different levels of instability.

---

# The Problem Without Protection

Imagine the following scenario:

```text
External gateway unavailable
```

Without any protection mechanism:

```text
Order
  ↓
Timeout
  ↓
Retry
  ↓
Timeout
  ↓
Retry
```

The result would be:
- Accumulation of requests    
- Excessive resource consumption    
- High response time    
- Cascading failures across services
    
---

# Circuit Breaker

To avoid this scenario, the Circuit Breaker pattern was implemented.

The goal is to temporarily stop new calls when an excessive number of failures is detected.

---

## Circuit Breaker States

### CLOSED

Normal operation.

```text
Order
   ↓
Gateway
```

All requests are allowed.

---

### OPEN

After reaching the configured limit of consecutive failures.

```text
Order
   ↓
Circuit Open
   ↓
Immediate failure
```

No call is sent to the gateway.

The system fails fast and protects the external integration.

---

### HALF_OPEN

After the waiting period.

```text
Test request
     ↓
Gateway
```

If the call succeeds:

```text
HALF_OPEN → CLOSED
```

If it fails:

```text
HALF_OPEN → OPEN
```

---

# Guaranteed Delivery

One of the main goals of this demonstration is to guarantee that no order is lost.

Three mechanisms were used for this.

---

## Persistent Messages

All messages are published as persistent.

```javascript
channel.sendToQueue(queue, buffer, {
  persistent: true
});
```

This guarantees survival even after RabbitMQ restarts.

---

## Explicit ACK

A message is only confirmed after successful processing.

```text
Success
   ↓
ACK
```

Otherwise:

```text
Failure
   ↓
NACK
```

---

## Dead Letter Queue

Problematic messages don't return immediately to the main queue.

Flow:

```text
Orders
   ↓
Failure
   ↓
DLQ
   ↓
Retry Queue
   ↓
Orders
```

This approach avoids aggressive reprocessing loops.

---

# Simulation Results

The run lasted approximately:

```text
115 seconds
```

During this period:

| Metric            | Value |
| ----------------- | ----- |
| Orders sent       | 20    |
| Total attempts    | 66    |
| Approvals         | 20    |
| Failures          | 46    |
| Retries           | 46    |
| Orders lost       | 0     |

---

# What Does This Mean?

Despite:

```text
46 failures
```

the final result was:

```text
20 orders approved
```

Every single order reached its destination.

No message was lost.

---

# Simulation Timeline

## Phase 1 — Unstable Environment

The gateway was configured with:

```text
70% failure rate
```

Observed events:

```text
t+0s
Unstable gateway
```

```text
t+9s
Circuit Breaker opens
```

```text
CLOSED → OPEN
```

From this point on, the system stops sending requests to the gateway.

---

## First Recovery Attempt

After the configured timeout:

```text
OPEN → HALF_OPEN
```

A test request is executed.

The gateway is still failing.

Result:

```text
HALF_OPEN → OPEN
```

The system remains protected.

---

## Phase 2 — Gateway Recovery

A dynamic change was made at runtime:

```text
70% → 5%
```

in the failure rate.

Without restarting containers.

Without interrupting the environment.

---

## Reopening and Closing

After a few successful attempts:

```text
OPEN
   ↓
HALF_OPEN
   ↓
CLOSED
```

The Circuit Breaker returns to its normal state.

---

# Circuit Breaker Evolution

Throughout the run, several transitions occurred.

```text
CLOSED → OPEN
OPEN → HALF_OPEN
HALF_OPEN → OPEN
OPEN → HALF_OPEN
HALF_OPEN → CLOSED
```

This demonstrates exactly the expected behavior of the pattern.

The circuit protects when needed and returns automatically once the dependency recovers.

---

# The Role of the DLQ

Without the Dead Letter Queue, the behavior would be:

```text
Failure
 ↓
Immediate retry
 ↓
Failure
 ↓
Immediate retry
```

Known as:

```text
Retry Storm
```

This pattern can bring entire systems down.

With DLQ:

```text
Failure
 ↓
Retry Queue
 ↓
Wait 30 seconds
 ↓
New attempt
```

The system gains time to recover.

---

# Observed Benefits

The demonstration highlights several architectural advantages.

### Decoupling

The orders service keeps operating even when payment fails.

---

### Fault Tolerance

External problems don't bring down the entire application.

---

### Dependency Protection

The Circuit Breaker prevents overloading services that are already unstable.

---

### Automatic Recovery

No manual intervention is required.

The system recovers on its own.

---

### Guaranteed Delivery

No message is lost.

Even in the face of dozens of failures.

---

### Scalability

New consumers can be added without changing the architecture.

---

# Lessons Learned

In distributed architectures, failures are not exceptions.

They are expected events.

That's why patterns such as:
- Circuit Breaker    
- Retry    
- Dead Letter Queue    
- Persistent Queues    
- ACK/NACK
    
should be part of the architectural design from the very start.

These mechanisms turn temporary failures into controlled delays, preventing data loss and systemic unavailability.

---

The simulation demonstrated how a microservices-based architecture can keep functioning even in the face of severe failures in external dependencies.

During the run, the gateway showed an extremely high failure rate, the Circuit Breaker kicked in several times, and dozens of processing attempts failed.

Even so, thanks to the use of persistent queues, Dead Letter Queues, controlled retries, and explicit processing confirmation, every single order was delivered successfully.

That is exactly the goal of resilience in distributed systems:

> Not to prevent failures from happening, but to guarantee that the business keeps running despite them.

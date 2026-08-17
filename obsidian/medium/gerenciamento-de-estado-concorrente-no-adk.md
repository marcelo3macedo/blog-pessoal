---
title: "Case Study: Concurrent State Management & Message Debouncing in AI Agents with Redis & RabbitMQ"
subtitle: "Eliminating race conditions, redundant LLM token spend, and out-of-order response delivery in high-volume conversational AI applications."
author: "Marcelo Macedo"
tags:
  - ai-agents
  - redis
  - rabbitmq
  - python
  - system-design
  - software-architecture
---

# Case Study: Concurrent State Management & Message Debouncing in AI Agents with Redis & RabbitMQ

> 💬 **The scenario:** a user cancels an order, then changes their mind 1.5 seconds later — and your AI agent still confirms the cancellation *after* they asked you not to. This is the architecture that makes that impossible, built with Redis distributed locks, RabbitMQ dead-letter queues, and an LLM-based intention triage layer.
>
> 📖 This is the Medium adaptation of the full case study. For the complete, continuously-updated version — plus the rest of the "além do script" engineering series — read it on the original blog: **[alemdoscript.com.br →](https://alemdoscript.com.br/posts/en/message-debouncing-redis-distributed-lock-intent-reevaluation)**

## Executive Summary

In high-volume conversational applications built with AI agents (operating on platforms like WhatsApp, Telegram, or custom webchats), user interaction rarely conforms to standard HTTP synchronous request-response cycles. Users naturally send multiple messages in rapid succession before the agent can complete inference and deliver a reply.

Without explicit architectural concurrency control, conversational systems encounter critical failures: **duplicated LLM token consumption**, **context desynchronization**, and **the delivery of out-of-order or contradictory messages**.

This case study demonstrates an enterprise architecture for **concurrent state management and message debouncing** in AI agents built with Python, FastAPI, Google ADK, Redis, and RabbitMQ.

- **Domain:** Conversational AI Agents / Concurrent State & Message Debouncing.
- **Technology Stack:** Python, FastAPI, Google ADK, Redis, RabbitMQ, Docker.
- **Business & Operational Impact:** Eliminates out-of-order/contradictory agent replies, reduces redundant LLM token costs by up to 50% during message collisions, and ensures strict delivery order under concurrent load.
- **Source Code Repository:** [github.com/marcelo3macedo/gerenciamento-estado-concorrente-no-adk](https://github.com/marcelo3macedo/gerenciamento-estado-concorrente-no-adk)

---

## 1. The Challenge: Rapid-Fire Messaging & Race Conditions

When interacting with virtual assistants, user behavior deviates significantly from traditional single-form web submissions. Users frequently type in short, bursty streams ("rapid-fire messaging").

Consider a real-world customer service scenario:
1. **t = 0.0s:** User sends Message A: *"I want to cancel order #10842."*
2. **t = 1.5s:** Before the agent finishes generating or dispatching the confirmation for A, the user changes their mind and sends Message B: *"Never mind, actually I just want to update the delivery address."*

If the backend architecture operates asynchronously without session-aware locks—where webhooks ingest messages independently, trigger parallel LLM calls, and push responses straight to a delivery queue—a **race condition** occurs.

```text
[ USER ]                      [ WEBHOOK (FastAPI) ]            [ RABBITMQ ]           [ CONSUMER ]
   |                                    |                           |                      |
   |-- Message A ("Cancel order") ----->|                           |                      |
   |                                    |-- ADK Agent generates A ->|                      |
   |                                    |-- Publish A (3s delay) -->|                      |
   |<- 200 OK (ACK) --------------------|                           |                      |
   |                                                                |                      |
   | (1.5s later: User sends B while A is still in delivery queue)  |                      |
   |-- Message B ("Change address") --->|                           |                      |
   |                                    |-- ADK Agent generates B ->|                      |
   |                                    |-- Publish B ------------->|                      |
   |<- 200 OK (ACK) --------------------|                           |                      |
   |                                                                |                      |
   |                                                                |--- Consumes A ------>|
   |<------------------ Dispatches Cancellation Response (A) ------------------------------|
   |                                                                |--- Consumes B ------>|
   |<------------------ Dispatches Address Update Response (B) ----------------------------|
   |
   * RESULT: User receives cancellation confirmation AFTER giving up on it!
```

### The Three Critical Dimensions of Failure

1. **Semantic Inconsistency & Contradictory Responses:** Message A's cancellation confirmation is pushed to the outbound broker. When B arrives 1.5 seconds later, its response is queued directly behind A. The user receives a confirmation of cancellation *after* explicitly instructing the system not to cancel, destroying trust in the assistant.
2. **Financial & Compute Waste (FinOps):** The backend consumes significant CPU cycles and GPU/LLM input-output tokens generating a reply for Message A, despite its conversational intent being rendered obsolete seconds later.
3. **Degraded User Experience (UX):** Overlapping, out-of-sequence chat bubbles violate the natural expectations of human-grade conversation.

---

## 2. System Architecture & Solution Design

To solve this race condition, we implemented a decoupled architecture featuring **Redis as a distributed session lock manager** and **RabbitMQ with Dead-Letter Exchanges (DLX) as an asynchronous delivery queue with an exponential backoff retry ladder**.

When a message arrives while a previous response for the same session is being processed or queued for dispatch, Redis flags an active lock. This lock signals the RabbitMQ consumer to hold delivery until a secondary **Intention Evaluator Agent** decides whether the pending message should be released, canceled, or merged into a single consolidated response.

```text
+-----------------------------------------------------------------------------------+
| USER INTERACTION                                                                  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| WEBHOOK SERVICE (FastAPI)                                                         |
|                                                                                   |
|  1. Activate Redis Lock: session                                                  |
|  2. Check pending state in session:                                               |
|     - If NO pending message  ==> Generate ADK Agent Response A                    |
|     - If YES pending message ==> Run Intention Evaluator Agent (Compare A vs B)     |
|                                  --> Generate ADK Agent Response B                |
+-----------------------------------------------------------------------------------+
       |                                                                     .
       v                                                                     . State Updates
+------------------------------------+                       +----------------------+
| RABBITMQ BROKER                    |                       | REDIS DATASTORE      |
| (outbound_messages queue)          |                       | - Session Locks      |
+------------------------------------+                       | - Pending State      |
       |                                                     | - Message Status     |
       v                                                     +----------------------+
+-----------------------------------------------------------------------------------+
| CONSUMER SERVICE                                                                  |
|                                                                                   |
|  Check Redis Lock & Message Status:                                               |
|  * Lock Active?              ==> NACK to Retry Ladder (0.3s -> 0.6s -> 1.2s)     |
|  * Lock Inactive + Normal?   ==> Dispatch message to User                         |
|  * Lock Inactive + CANCELLED?==> Discard (ACK without dispatch)                   |
|  * Lock Inactive + SUPERSEDED==> Discard (ACK without dispatch)                   |
|  * Retry Ladder Exhausted?   ==> Move to outbound_messages.parked                 |
+-----------------------------------------------------------------------------------+
```

### Evolutionary Architecture Progression

The project repository was engineered across four distinct Git branches, establishing a clear baseline and iteratively introducing resilience layers:

- **`feature/01-naive-fastapi-rabbitmq-delay`** — Webhook + ADK Agent + Outbound Queue with operational delay. *Objective:* baseline un-protected scenario demonstrating message collision and race conditions.
- **`feature/02-redis-lock-rabbitmq-exponential-backoff`** — Redis session locks + RabbitMQ DLX retry ladder. *Objective:* intercepts consumer delivery during session triage, holding in-flight messages.
- **`feature/03-google-adk-intent-evaluator-triage`** — **Intention Evaluator Agent** (`RELEASE_FIRST`, `CANCEL_FIRST`, `MERGE`). *Objective:* LLM-driven decision engine evaluating intent collisions in real-time.
- **`feature/04-e2e-simulative-tests-pytest-testcontainers`** — Full E2E test suite using Pytest and Testcontainers. *Objective:* automated validation of concurrency state transitions under simulated network load.

---

## 3. Message Lifecycle & State Machine

A critical design choice is treating messages in the outbound broker not as binary "delivered/undelivered" items, but as entities moving through an explicit state machine managed in Redis:

```text
                  +-----------------------------------+
                  |  Publish to outbound_messages     |
                  |  + Set pending:session            |
                  +-----------------------------------+
                                    |
                                    v
                          +-------------------+
                          |     InFlight      |
                          +-------------------+
                                    |
        +------------------+--------+--------+-------------------+
        | (Lock inactive)  | (Intent=CANCEL)| (Intent=MERGE)    | (Lock active)
        v                  v                 v                   v
+---------------+  +---------------+  +---------------+  +---------------+
|   Delivered   |  |   Cancelled   |  |  Superseded   |  |    InRetry    |
+---------------+  +---------------+  +---------------+  +---------------+
        |                  |                 |                   |
        v                  v                 v                   v
+---------------+  +---------------+  +---------------+  +---------------+
| Dispatch to   |  | ACK & Discard |  | ACK & Discard |  | DLX Re-queue  |
| User          |  | (reason=cancel)| | (reason=super)|  | (Max 3 retries|
+---------------+  +---------------+  +---------------+  | or Parked)    |
                                                         +---------------+
```

### The Lock vs. Status Responsibility

- **Redis Session Lock (`lock:session`):** Answers *"Is triage currently underway for this user session?"*
- **Message Status Key (`status:message_id`):** Answers *"What action must the consumer perform once triage completes?"*

### The Retry Ladder & Dead-Letter Queue

While a session lock is active, the RabbitMQ consumer does not block threads or hold connections open. Instead, it rejects the message (`NACK`) and routes it to a delay queue with an increasing Time-To-Live (TTL):

1. **Attempt #1:** NACK $\rightarrow$ `outbound_messages.retry.0.3s` (TTL: 0.3s)
2. **Attempt #2:** NACK $\rightarrow$ `outbound_messages.retry.0.6s` (TTL: 0.6s)
3. **Attempt #3:** NACK $\rightarrow$ `outbound_messages.retry.1.2s` (TTL: 1.2s)
4. **Exhaustion:** Move to `outbound_messages.parked` (Quarantine queue)

### Empirical Timeline of a Parked Message (Stale Lock Failure Mode)

When an upstream process crashes without releasing a lock, the system safely quarantines the message rather than looping infinitely:

- **t = 0.00s** — Message Published → enters `outbound_messages` (Attempt #1)
- **t = 0.60s** — Consumer Pick-Up & Rejection #1 → lock active, NACK to 0.3s backoff queue
- **t = 0.90s** — Consumer Pick-Up & Rejection #2 → lock active, NACK to 0.6s backoff queue
- **t = 1.51s** — Consumer Pick-Up & Rejection #3 → lock active, NACK to 1.2s backoff queue
- **t = 2.71s** — Ladder Exhausted → Parked. 3 attempts exceeded, moved to `outbound_messages.parked`

---

## 4. Empirical Evaluation & Decision Scenarios

Using `scripts/simulate_intention_triage.py`, we executed real E2E test runs simulating rapid-fire message arrival (Message B arriving 0.3s after Message A, within a 0.6s delivery window).

### Decision Matrix Breakdown

- **`RELEASE_FIRST`**
  - *Conditions:* Message B does not conflict with Message A — e.g., A: "What are your hours?" / B: "Do you accept card?"
  - *System Action:* Lock released. Message A dispatches immediately; Message B processes right after.
  - *End-User Experience:* Both replies arrive sequentially without delay.
- **`CANCEL_FIRST`**
  - *Conditions:* Message B explicitly revokes Message A — e.g., A: "Cancel my order" / B: "Never mind, keep it"
  - *System Action:* Message A flagged `CANCELLED`. Consumer ACK-discards A without dispatching.
  - *End-User Experience:* User receives only the response to B, avoiding confusion.
- **`MERGE`**
  - *Conditions:* Message B complements or updates Message A — e.g., A: "Add a pizza" / B: "And a Coke"
  - *System Action:* Message A flagged `SUPERSEDED`. Agent evaluates full history and emits combined response.
  - *End-User Experience:* User receives a single unified reply containing both items.
- **`PARKED`**
  - *Conditions:* Unhandled system crash / lock freeze.
  - *System Action:* Retry ladder exhausts after 2.71s; message moved to dead-letter storage.
  - *End-User Experience:* Prevents consumer CPU starvation and infinite retry loops.

### End-to-End Latency Benchmarks (Real E2E Log Telemetry)

- **RELEASE_FIRST — Message A** — Delivered — **606 ms**
- **RELEASE_FIRST — Message B** — Delivered — **891 ms**
- **CANCEL_FIRST — Message A** — Discarded (`reason=cancelled`) — **607 ms**
- **CANCEL_FIRST — Message B** — Delivered — **892 ms**
- **MERGE — Message A** — Discarded (`reason=superseded`) — **608 ms**
- **MERGE — Message B** — Delivered (Unified response) — **893 ms**
- **Stale Lock Failure Case** — Parked (`outbound_messages.parked`) — **2,711 ms**

---

## 5. Decision Analysis & Trade-Offs

- **Explicit Lock Release with TTL Safety Net**
  - *Alternative Considered:* Rely purely on fixed Redis TTLs (e.g., 5s)
  - *Engineering Rationale:* Holding locks for the full TTL duration forces every queued message to wait 5 seconds, introducing unnecessary latency.
  - *Accepted Trade-Off:* If a worker process abruptly dies mid-triage, the queued message must wait for the TTL to expire before retrying.
- **LLM-Based Intention Triage (`IntentionDecision` schema)**
  - *Alternative Considered:* Regex or keyword heuristics
  - *Engineering Rationale:* Language nuances (e.g., *"cancel"* vs *"don't cancel, never mind"*) require semantic understanding that keyword matching fails to capture.
  - *Accepted Trade-Off:* Collisions add a lightweight secondary LLM call, incurring small API latency and cost overhead.
- **Capped Retry Ladder (3 attempts) + Parking Queue**
  - *Alternative Considered:* Uncapped infinite retries
  - *Engineering Rationale:* Prevents zombie lock scenarios from consuming message consumer threads indefinitely.
  - *Accepted Trade-Off:* Parked messages require manual operator inspection or an automated dead-letter monitor.
- **Asynchronous Broker Dispatch (RabbitMQ)**
  - *Alternative Considered:* Direct synchronous HTTP response in webhook
  - *Engineering Rationale:* Simulates real-world messaging channel latency and enables pre-dispatch message revocation.
  - *Accepted Trade-Off:* Introduces minor infrastructure complexity (broker management) compared to synchronous HTTP APIs.

---

## 6. Key Takeaways & Engineering Insights

1. **Locks Provide Structure; LLMs Provide Intent:** The Redis session lock and RabbitMQ retry ladder act as the traffic control layer. However, the ultimate user experience relies on the **Intention Evaluator Agent** mapping language context into deterministic actions (`RELEASE_FIRST`, `CANCEL_FIRST`, `MERGE`).
2. **FinOps & Token Optimization:** By intercepting obsolete in-flight requests (`CANCEL_FIRST`), the platform avoids redundant downstream LLM generations, cutting token costs during rapid user edits.
3. **Human-Centric UX:** Human operators naturally pause typing when a customer sends a follow-up message mid-response. Replicating this behavior via debouncing produces virtual assistants that feel significantly more natural and context-aware.
4. **System Resilience Against Cascading Failures:** Combining exponential backoff with a hard retry cap ensures that infrastructure anomalies (e.g., killed processes) degrade gracefully into a quarantine queue rather than cascading into system-wide queue backup.

---

## Source Code & Reproduction

The complete source code, featuring all evolutionary Git branches, Docker Compose configurations, and Pytest suites, is open-sourced on GitHub:

🔗 **[github.com/marcelo3macedo/gerenciamento-estado-concorrente-no-adk](https://github.com/marcelo3macedo/gerenciamento-estado-concorrente-no-adk)**

---

> 📖 **Liked this breakdown?** Read it in its original, fully-formatted home — with live architecture diagrams and the rest of the engineering series — on the source blog:
>
> ### 🔗 [alemdoscript.com.br →](https://alemdoscript.com.br/posts/en/message-debouncing-redis-distributed-lock-intent-reevaluation)

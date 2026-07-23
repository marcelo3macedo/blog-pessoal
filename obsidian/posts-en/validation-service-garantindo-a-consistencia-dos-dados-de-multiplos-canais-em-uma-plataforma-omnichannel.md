---
title: "Validation Service: ensuring data consistency across multiple channels in an omnichannel platform"
category: arquitetura
excerpt: The Validation Service receives incoming events from various channels and ensures they are valid before forwarding them to the other microservices (support, chatbot, CRM, analytics, etc.).
slug: validation-service-ensuring-data-consistency-across-multiple-channels-in-an-omnichannel-platform
published_at: 2026-07-20
tags:
  - architecture
  - consistency
  - quality
  - microservices
seo_title: "Validation Service: ensuring data consistency across multiple channels in an omnichannel platform"
seo_description: The Validation Service receives incoming events from various channels and ensures they are valid before forwarding them to the other microservices (support, chatbot, CRM, analytics, etc.).
seo_keywords:
  - architecture
  - consistency
  - quality
  - microservices
---
# Validation Service: ensuring data consistency across multiple channels in an omnichannel platform

In omnichannel platforms, thousands of messages arrive continuously through different channels such as WhatsApp, Instagram, Facebook Messenger, and Telegram.

Although it's tempting to run all the business logic immediately after receiving the webhook, this approach usually creates scalability, availability, and reliability problems.

---

# Introduction

The **Validation Service** is a microservice dedicated exclusively to **validating incoming data** from communication channels.

Its goal is **not to interpret messages, respond to users, or execute business rules**, but to ensure that everything that reaches the system is legitimate before it moves on to the rest of the architecture.

Incoming events normally arrive through webhooks from platforms such as:
- WhatsApp Business API (Meta)
- Instagram
- Facebook Messenger
- Telegram

This service acts as a **security layer**, preventing invalid, tampered, or unauthorized data from being propagated to other microservices.

After validating the authenticity of the request, the message is published to a queue for asynchronous processing by the services responsible for support, chatbot, CRM, analytics, and other platform components.

Its responsibility ends exactly at that point.

---

# Responsibilities of the Validation Service

The Validation Service has well-defined responsibilities.

It should:
- receive public webhooks;
- validate the authenticity of the source;
- validate the minimum message format;
- publish the event to the queue;
- respond quickly to the provider.

It **should not**:
- query the database;
- execute business rules;
- call other microservices;
- respond to end users;
- interpret conversation content.

---

# Available routes

Since the service receives webhooks from external providers, it exposes very few HTTP routes.

| Method | Endpoint | Purpose |
|---------|----------|------------|
| POST | `/webhooks/meta` | Receiving events from Meta |
| POST | `/webhooks/telegram` | Receiving events from Telegram |
| GET | `/health` | Application health check |
| GET | `/ready` | Availability check |

Since this is an API directly exposed to the Internet, every request must go through security validations.

## Meta webhooks

For events coming from Meta, the **HMAC** signature sent in the request headers is validated.

Only after confirming that the signature matches the received payload is the message considered valid.

This validation prevents content from being altered during transmission and guarantees that the webhook was actually sent by Meta.

## Telegram webhooks

For Telegram, authentication happens through the **Secret Token**, configured when the webhook is registered.

If the received token doesn't match the expected one, the request is immediately discarded.

---

# How it works

When receiving a webhook from Meta or Telegram, the goal of the API **is not to process the entire message**, but only to confirm that it was successfully received.

After validating its authenticity, the message is published to a queue and the service immediately responds with **HTTP 200 OK**.

This approach offers several advantages.

## Avoiding webhook retries

If the source platform doesn't receive an `HTTP 200` within the expected time, it assumes delivery failed and will automatically retry.

The longer the processing time, the greater the number of retransmissions.

---

## Reducing duplicate messages

Retries significantly increase the chance of duplicate processing.

By responding quickly, we naturally reduce the need for complex idempotency mechanisms.

---

## Absorbing traffic spikes

During promotional campaigns or peak hours, thousands of messages can arrive simultaneously.

Responding quickly prevents HTTP connections from staying open while waiting for internal processing.

---

## Availability

Even if a database or another microservice is slow or unavailable, webhook reception keeps working normally, as long as the queue is operational.
This significantly reduces the impact of internal failures.

---

## Scalability

Separating reception from processing allows scaling only the queue consumers as demand grows.
There's no need to scale up the layer responsible for receiving webhooks whenever message volume increases.

---

# Architecture flow

```text
Meta / Telegram

        │

        ▼

 Validation Service

        │

 HMAC / Secret validation

        │

        ▼

    RabbitMQ

        │

        ▼

 Consumers

        │

 ├── Support
 ├── Chatbot
 ├── CRM
 └── Analytics

```


# Infrastructure

As an example, consider the following infrastructure hosted on AWS.

| Component         | Configuration                 |
| ------------------ | ---------------------------- |
| Validation Service | AWS ECS Fargate              |
| Initial tasks     | 2                            |
| Resources per task  | 0.5 vCPU / 1 GB RAM          |
| RabbitMQ           | 2 vCPU / 4 GB RAM            |
| Auto Scaling       | Based on CPU and Queue Depth |
Next, let's see how this architecture behaves under different load levels.

---

# Scenario 1 — 300 messages per second
In this scenario, the incoming volume is relatively low and the infrastructure operates comfortably.

### Behavior
- Task CPU at approximately **45%**
- Queue practically empty
- Low latency
- Continuous processing

```text
                300 msg/s
                    │
                    ▼
        Validation Service
           (2 ECS Tasks)
                    │
                    ▼
              RabbitMQ
                    │
                    ▼
             Consumers

Queue ≈ 0 messages
```

In this scenario there's no need to scale the application.

---

# Scenario 2 — 800 messages per second

As load increases, the queue starts growing temporarily.
Auto Scaling identifies two important indicators:
- CPU above **70%**
- Queue Depth greater than **5,000 messages**

ECS automatically increases the number of Validation Service instances from **2 to 4 Tasks**.

### Result
- CPU returns to approximately **50%**
- The queue gradually shrinks
- RabbitMQ continues only storing messages temporarily

```text
               800 msg/s
                    │
                    ▼
      Validation Service
          (4 ECS Tasks)
                    │
                    ▼
              RabbitMQ
                    │
                    ▼
             Consumers

Queue

5,000
3,200
1,800
900
120
```

The queue acts only as a temporary buffer until consumers catch back up with the incoming rate.

---

# Scenario 3 — 2,000 messages per second

In this scenario there's a high message spike.

Auto Scaling automatically increases the Validation Service to **8 Tasks**, keeping webhook reception stable.
From this point on, behavior depends on the consumers' speed.

## Fast consumers
When the consumption rate keeps up with the publishing rate, RabbitMQ stays practically empty.

```text
Input

2,000 msg/s

        │
        ▼

Validation Service
    (8 Tasks)

        │
        ▼

RabbitMQ

        │
        ▼

Consumers

2,000 msg/s

Queue

200
350
150
220

(almost always empty)
```

In this scenario:
- RabbitMQ memory remains low.
- The queue is used only as a buffer.
- Latency remains low.

---

## Slow consumers
Now consider consumers processing only **500 messages per second**.

```text
Input

2,000 msg/s

        │
        ▼

Validation Service

        │
        ▼

RabbitMQ

        │
        ▼

Consumers

500 msg/s

Queue

10,000

↓

30,000

↓

80,000

↓

150,000 messages
```

Since production is greater than consumption, the queue keeps growing.
As a result, RabbitMQ starts using more memory.

```text
RAM

50%

↓

70%

↓

85%

↓

90%
```

When the configured limit is reached, the broker automatically activates the memory protection mechanism.

```text
Memory Alarm

↓

Paging

↓

Messages start
being written to disk
```

Even during **Paging**:
- The broker keeps accepting new messages.
- Producers keep publishing normally.
- Consumers keep processing the queue.
- The oldest messages stay stored on disk.

Once memory becomes available again:

```text
Paging

↓

Disabled

↓

Messages return
to RAM
```

This mechanism allows RabbitMQ to absorb large traffic spikes without message loss.

---

# Why use RabbitMQ?

The main problem solved by the Validation Service is **work distribution (Work Queue)**.
Each message needs to:
- be validated only once;
- be consumed by only one instance;
- have low latency;
- allow fine-grained control over consumers.

RabbitMQ was designed exactly for this kind of scenario.

---

# Why not use Amazon SQS?

Amazon SQS would also address the problem.

However, some RabbitMQ features make it more appealing in this context.

## Prefetch

In RabbitMQ, it's possible to limit exactly how many messages each consumer receives simultaneously.

```text
prefetch = 20
```

This prevents one instance from getting overloaded while others remain idle.

In SQS, this control is more limited, being based on the number of messages fetched per request (`MaxNumberOfMessages`).

---

## Routing

RabbitMQ has an extremely flexible mechanism based on Exchanges and Routing Keys.

```text
instagram.*

↓

Instagram Queue

telegram.*

↓

Telegram Queue
```

In SQS, it would normally be necessary to combine SNS with multiple queues to achieve similar behavior.

---

## Latency

RabbitMQ usually works with latencies of just a few milliseconds.

```text
RabbitMQ

≈ a few milliseconds
```

Meanwhile, SQS tends to show higher latencies.

```text
Amazon SQS

≈ tens of milliseconds
```

Although this difference isn't decisive for webhooks, RabbitMQ tends to respond faster.

---

## Observability

Another important differentiator is its admin interface.
It makes it easy to track:
- ready messages;
- unacknowledged messages;
- publish/s;
- ack/s;
- consumers;
- memory usage;
- paging;
- queue growth.

This visibility makes operating the platform much easier.

---

# Why not use Kafka?

Kafka solves a different problem.
It was created for **event streaming** platforms, where multiple consumers need to process the exact same event.

For example:

```text
Validated message

↓

CRM

↓

Analytics

↓

Data Lake

↓

Machine Learning

↓

Chatbot
```

In this scenario, Kafka is excellent.
However, the Validation Service has a much simpler flow.

```text
Message

↓

Validate

↓

End
```

Each message needs to be processed only once, by a single consumer.
In this context, Kafka would add unnecessary complexity.

---

# Kafka's operational complexity

Additionally, using Kafka would mean managing several extra components:

- Brokers
- Partitions
- Replication
- Consumer Groups
- Offsets
- Retention
- Log Segments

All this infrastructure makes sense for large-scale event-driven platforms, but it would be overkill for a queue dedicated exclusively to webhook validation.

---

# Conclusion

The Validation Service acts as the first line of defense of an omnichannel platform.

By focusing exclusively on webhook validation, responding quickly to providers, and decoupling processing through RabbitMQ, the architecture gains:
- Higher availability
- Lower coupling
- Better scalability
- Greater capacity to absorb traffic spikes
- Easier operation and monitoring

This pattern is widely used in highly available distributed systems and represents a simple, efficient, and robust approach to handling large volumes of messages coming from multiple channels.

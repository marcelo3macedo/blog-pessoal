---
title: "Flow Service: building a scalable automation engine for omnichannel platforms"
category: arquitetura
excerpt: Discover how to design a Flow Service capable of running complex automations on an omnichannel platform without blocking queues, while maintaining high availability, scalability, and low coupling. In this article we explore a state-based architecture, RabbitMQ, independent modules, and asynchronous execution.
slug: flow-service-scalable-automation-engine-omnichannel-platforms
published_at: 2026-07-21
project: flow-service
tags:
  - architecture
  - consistency
  - quality
  - microservices
seo_title: "Flow Service: building a scalable automation engine for omnichannel platforms"
seo_description: Discover how to design a Flow Service capable of running complex automations on an omnichannel platform without blocking queues, while maintaining high availability, scalability, and low coupling. In this article we explore a state-based architecture, RabbitMQ, independent modules, and asynchronous execution.
seo_keywords:
  - architecture
  - consistency
  - quality
  - microservices
---
In the previous articles we saw how a webhook is received, validated, and forwarded for processing in a secure way. At this point, the platform has already identified the message's origin, validated its authenticity, located the corresponding channel, and created (or retrieved) the conversation associated with the user.

It's from this stage onward that the **Flow Service** comes into play, responsible for executing the automation configured for that channel.

On an omnichannel platform, receiving a message is just the beginning of the journey.

A simple message sent through WhatsApp can trigger dozens of different actions: validating customer data, querying external APIs, updating internal systems, sending automatic replies, and logging information for service and analytics purposes.

```text
Mensagem Whatsapp
↓
Verificar CPF (5 s)
↓
Consultar Receita Federal (3 s)
↓
Consulta API com IA (2.5 s)
↓
Enviar mensagem (2 s)
↓
Atualizar CRM
↓
Fim
```

Running this entire flow within a single consumer seems simple, but it only takes one external API taking a few extra seconds to drastically reduce the queue's throughput.

In this article, we'll focus exclusively on this service's architecture: how it controls execution state, walks through the automation flow, and runs each step in a scalable way, even when some of them depend on external APIs or long-running operations.

For other perspectives on the service, check out:
- The [Flow Service project](/projetos/flow-service).
- See the [detailed inner workings of the Flow Service](/posts/en/flow-service-how-it-works-in-detail).

---

# Infrastructure

For this scenario, we'll consider the **Flow Service** running on **2 Tasks on AWS ECS Fargate**, each with **1 vCPU and 2 GB of memory**. This configuration offers enough capacity to start processing with headroom to spare and allows horizontal scaling as demand increases.

As a reference point, this infrastructure is capable of processing roughly **200 messages per second** (about **12,000 messages per minute**), considering that most flow nodes perform fast operations and that longer-running calls are decoupled into specialized workers.

Communication between the Validation Service and the Flow Service happens through **RabbitMQ**, using a **Work Queue** type queue, where each message is delivered to only one consumer.

RabbitMQ was chosen mainly because of the characteristics of this type of processing:
- Low latency for consuming and publishing;
- Manual ACK, ensuring a message is only removed from the queue after being processed;
- **Prefetch** control, allowing you to limit how many messages each instance processes simultaneously;
- Ease of implementing retry queues and Dead Letter Queues (DLQ);
- Excellent observability, with metrics on queues, consumers, publish rate, acknowledgements, and memory usage.

Although **Amazon SQS** is also a valid alternative, it offers less flexibility for this scenario. Features such as fine-grained consumer control (Prefetch), advanced routing, and retry mechanisms usually require additional implementations using other AWS services, such as SNS and multiple queues.

---

# Node-based Processing

Although the Flow Service is responsible for controlling automation execution, it **does not directly perform long-running operations**.

Whenever a node represents an external integration or a long-running task, it simply schedules its execution on a specific queue and immediately frees up the consumer.

This approach prevents slow calls from reducing the throughput of the main queue.

## Architecture

```text
                        flow.execute.queue
                               │
                               ▼
                     Flow Service (N Tasks)
                               │
                 Executa Node Atual (rápido)
                               │
      ┌───────────────┬─────────┴───────────────┐
      │               │                         │
      ▼               ▼                         ▼

Verificar CPF   Receita Federal          IA Generativa
(sync)          (assíncrono)             (assíncrono)

      │               │                         │
      │               ▼                         ▼
      │      queue.rf.request          queue.ai.request
      │               │                         │
      │               ▼                         ▼
      │         RF Worker                 AI Worker
      │               │                         │
      │               ▼                         ▼
      │        Receita Federal          OpenAI / Claude
      │               │                         │
      └───────────────┴──────────────┬──────────┘
                                     │
                                     ▼
                            flow.resume.queue
                                     │
                                     ▼
                              Flow Service
                                     │
                                     ▼
                             Próximo Node
```

---

# Executing Asynchronous Nodes

Not every node has the same processing time.

While some run in a few milliseconds (such as IF, Switch, or calculations), others depend on external APIs and can take several seconds to complete.

If all of this processing were handled by the same consumer, it would remain blocked waiting for each API's response, drastically reducing the queue's throughput.

To avoid this problem, the Flow Service uses **specialized consumers per node type**.

---
# Module Organization

Although they all belong to the **Flow Service**, each integration has its own module and its own consumer.

```text
src/
modules/
├── if/
│ └── if.module.ts
│
├── switch/
│
├── calculate/
│
├── http/
│ ├── http.module.ts
│ └── http.consumer.ts
│
├── receita-federal/
│ ├── receita.module.ts
│ └── receita.consumer.ts
│
├── ai/
│ ├── ai.module.ts
│ └── ai.consumer.ts
│
├── crm/
│ ├── crm.module.ts
│ └── crm.consumer.ts
│
└── send-message/
├── send.module.ts
└── send.consumer.ts
```


Each module is responsible only for executing its own node type.

---

# Benefits

Each integration has its own worker and its own queue.
This means that a problem in one external API doesn't affect the other integrations.

For example:

```text
queue.rf.request
Ready: 2
Consumers: 3
Latency: 80 ms
────────────────────────────
queue.ai.request
Ready: 12.500
Consumers: 5
Latency: 6.8 s
────────────────────────────
queue.crm.request
Ready: 0
Consumers: 2
Latency: 40 ms
```

It becomes immediately clear that the slowdown is concentrated in the AI integration.
Meanwhile:

- CPF is still being validated normally;
- Receita Federal queries are still being executed;
- CRM updates keep working;
- new flows keep starting.

Only the flows that depend on the **AI Query** node wait their turn.

---

# Monitoring

Since each node type has its own queue, spotting bottlenecks becomes simple.

```text
module.receita.queue
Ready: 2
Consumers: 2
────────────────────────
module.ai.queue
Ready: 4.850
Consumers: 3
────────────────────────
module.crm.queue
Ready: 0
Consumers: 2
```


In this example, it's clear that the slowdown is concentrated only in the AI integration.

The other modules keep processing normally.
This separation makes it easier to monitor, tune Auto Scaling, and identify bottlenecks without impacting the rest of the platform.

---

# A natural evolution

In this article, all consumers belong to the same **Flow Service**. This approach simplifies development, reduces the number of services to maintain, and is usually enough for most initial scenarios.

However, the architecture was designed to evolve naturally.

As message volume grows or certain integrations start requiring specific characteristics — such as greater processing capacity, their own libraries, different timeouts, or dedicated computing resources — those consumers can be extracted into independent services.

Since all communication happens through RabbitMQ, this migration has low impact on the architecture. The Flow Service keeps publishing messages to the same queue, while only the responsible consumer moves to run in another service.

```text
Hoje

Flow Service
├── Flow Consumer
├── AI Consumer
├── CRM Consumer
├── HTTP Consumer
└── Receita Consumer
↓
Evolução

Flow Service
│
└── Flow Consumer
AI Service
│
└── AI Consumer
Integration Service
├── HTTP Consumer
├── CRM Consumer
└── Receita Consumer
```

In practice, the flow execution engine remains exactly the same. Only the responsibility for executing certain nodes moves to specialized services.

This strategy makes it possible to start the project with a simple architecture and, as the platform grows, evolve into a distributed solution without changing contracts, queues, or how the Flow Service works.

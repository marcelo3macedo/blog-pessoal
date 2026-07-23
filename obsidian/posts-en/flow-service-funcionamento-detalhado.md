---
title: "Flow Service: a detailed look at how the flow automation engine works for omnichannel platforms"
category: projetos
excerpt: After identifying the conversation and the automation flow associated with the channel, the Flow Service takes over control of the entire automation execution.
slug: flow-service-how-it-works-in-detail
published_at: 2026-07-21
project: flow-service
tags:
  - architecture
  - consistency
  - quality
  - microservices
seo_title: "Flow Service: a detailed look at how the flow automation engine works for omnichannel platforms"
seo_description: After identifying the conversation and the automation flow associated with the channel, the Flow Service takes over control of the entire automation execution.
seo_keywords:
  - architecture
  - consistency
  - quality
  - microservices
---
In the previous articles we saw how a webhook is received, validated, and forwarded for processing in a secure way. At this point, the platform has already identified the message's origin, validated its authenticity, located the corresponding channel, and created (or retrieved) the conversation associated with the user.

It's from this stage onward that the **Flow Service** comes into play, responsible for executing the automation configured for that channel.

In this article, we'll focus exclusively on how this service works, understanding which actions it performs and how it performs them.

---
# How it works

The execution flow happens as follows:
```text
Message
         (flow.execute.queue queue)
                         │
                         ▼
                  Flow Service
                         │
                         ▼
        Loads Flow (JSON) from Redis Cache (base structure -> react-flow)
                         │
                         ▼
      Flow linked to the Channel found?
                  │                 │
                 No                Yes
                  │                 ▼
                  │          Fetches INSTANCE
                  │                 │
                  │                 ▼
                  │       First interaction?
                  │          │          │
                  │        Yes          No
                  │          │          │
                  │          ▼          ▼
                  │     First Node    Last executed
                  │                       Node
                  │          └──────┬───────┘
                  │                 ▼
                  │         Executes Module
                  │                 │
                  │                 ▼
                  │       Updates INSTANCE
                  │                 │
                  │                 ▼
                  │         Records STEP
                  │                 │
                  │                 ▼
                  │       Analyzes return
                  │                 │
                  │     ┌───────────┼────────────┐
                  │     │           │            │
                  │     ▼           ▼            ▼
                  │  Stay at      Send         Next
                  │   Node       Response       Node
                  │     │           │            │
                  │     │           ▼            ▼
                  │     │      Publishes     Publishes
                  │     │      message       flow.execute
                  │     │      to channel      again
                  │     │
                  ▼     ▼
                 End    End
```

## Receiving the message
Each message received by the service contains all the information needed to locate the corresponding conversation:
- message content;
- message type (text, image, audio, etc.);
- origin channel;
- conversation identifier;
- sender.  

This data is enough for the Flow Service to figure out exactly which point of the automation that conversation is currently at.

---
## Loading the flow
Each channel has an associated automation flow.
This flow is stored as **JSON**, following a structure similar to **React Flow**, containing:
- Nodes (steps);
- Edges (connections between steps);
- Specific configuration for each node.  

Since this flow rarely changes, it stays **cached** (REDIS), reducing database queries.

---

## Recovering the execution state
After locating the flow, the service checks whether that conversation has already started an automation.
This information is obtained through the **INSTANCE**, responsible for storing the current execution state.
The INSTANCE contains, for example:
- conversation ID;
- current node;
- variables accumulated during the flow;
- execution status.
If no INSTANCE exists, it means this is the user's first interaction, and processing starts from the flow's first node.

Otherwise, execution continues exactly from the point where it left off.

---
## Execution history
While the INSTANCE represents the current state, the **STEPS** table logs the entire execution history.
Each pass through a node generates a new record containing information such as:
- node executed;
- timestamp;
- input received;
- output produced;
- changes made to variables;
- execution time;
- possible errors.

This history makes auditing, debugging, and reprocessing easier.

---
## Executing the modules
The Flow Service doesn't know the implementation details of each node type. It simply locates the corresponding module and executes its standard interface.
Each module is fully independent, following the principles of low coupling and high cohesion.
Depending on the configuration received in the node's **data** field, the module may:
- perform calculations;
- query the database;
- change conversation information;
- consume external APIs;
- send messages;
- manipulate variables;
- execute business rules.

---

## Execution result
Regardless of the module type, its return always follows the same logical structure.
It can indicate that:
- the flow should stay on the current node;
- a message needs to be sent to the customer;
- variables need to be updated;
- execution should move on to a specific next node;
- the flow has finished.
  
This standardization makes the execution engine extremely simple and decoupled from the modules.

---
## Figuring out the next step
After executing the module, the Flow Service analyzes the return.
There are two possible behaviors.

### Staying on the current node
Some modules represent waiting states, such as waiting for a user response.
In that case, the INSTANCE is updated and execution ends at that point.

When a new message arrives, processing will resume from that exact same node.

```text

Message
↓
Node "Ask for Name"
↓
Waiting for response
↓
INSTANCE saved
↓
End

```

---
### Moving on to another node

When the module indicates continuation, the Flow Service checks the flow's **Edges** to figure out which will be the next node.
If the module itself specified a specific destination (for example, in a condition or Switch), that path takes priority.

After determining the next node, the INSTANCE is updated and a new message is published to the queue to continue execution.

```text

Current Node
↓
Updates INSTANCE
↓
Finds next Edge
↓
Publishes again
↓
Flow Service continues execution

```

  
This model turns each automation step into a small unit of work, allowing processing to be distributed across multiple instances of the service without losing the context of each conversation.

---

# Code organization
Since each **node** has different behavior, a good approach is to use a modular architecture based on the **Strategy** pattern, where the Flow Service acts only as an orchestrator. All business rules are encapsulated within the modules responsible for each node type.

This organization reduces coupling, makes it easier to create new nodes, and avoids changes to the main engine whenever a new feature is added.
 
## Folder structure

```text

src/
├── application/
│ ├── consumers/
│ │ └── flow.consumer.ts
│ │
│ ├── services/
│ │ ├── flow.service.ts
│ │ ├── instance.service.ts
│ │ ├── step.service.ts
│ │ └── flow-cache.service.ts
│ │
│ └── dto/
│
├── domain/
│ ├── entities/
│ │ ├── flow.ts
│ │ ├── instance.ts
│ │ └── step.ts
│ │
│ ├── interfaces/
│ │ ├── node-module.ts
│ │ └── node-result.ts
│ │
│ └── repositories/
│
├── infrastructure/
│ ├── rabbitmq/
│ ├── redis/
│ ├── database/
│ └── api/
│
├── modules/
│ ├── if/
│ ├── switch/
│ ├── delay/
│ ├── http/
│ ├── database/
│ ├── send-message/
│ ├── update-attendance/
│ ├── calculate/
│ ├── webhook/
│ ├── ai/
│ └── ...
│
├── shared/
│ ├── logger/
│ ├── errors/
│ └── utils/
│
└── main.ts

```

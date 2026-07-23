---
title: "Building a Smart Chat with Local AI: less model, more context"
category: desenvolvimento-web
excerpt: When we think about an AI chat for a system, we usually picture a giant model answering any question. In practice, the goal is often much more specific.
slug: building-smart-chat-local-ai-less-model-more-context
published_at: 2026-07-08
tags:
  - artificial-intelligence
  - challenges
  - running
  - conversation
  - ai-agents
seo_title: "Building a Smart Chat with Local AI: less model, more context"
seo_description: When we think about an AI chat for a system, we usually picture a giant model answering any question. In practice, the goal is often much more specific.
seo_keywords:
  - artificial-intelligence
  - challenges
  - running
  - model
---
# Building a Smart Chat with Local AI: less model, more context

When we think about an AI chat for a system, we usually picture a giant model answering any question. In practice, the goal is often much more specific.

In this project, the client's request was simple:
- answer questions about how the platform works;
- answer questions related to the user's own data, such as active challenges, ranking, activities, and progress;
- deliver fast, natural, and reliable answers.

Instead of using an extremely large model hosted on an external service, the solution was built using **gpt-oss running locally through Ollama**.

The result was quite satisfying.

This shows that, when context is well organized, it's not always necessary to use the largest available model to deliver an excellent user experience.

## Project link
Check it out: https://github.com/marcelo3macedo/simple-chatbot-with-ollama-and-apis

---

# AI models don't know your system

This is one of the most important concepts when building AI-powered applications.

A language model doesn't know:
- who the user is;
- what data exists in the database;
- which challenges the user is participating in;
- their ranking;
- their recent activities;
- platform-specific rules.

Without this information, the AI will respond using only the knowledge acquired during training, producing generic or simply incorrect answers.

The solution consists of **enriching each request sent to the model** with the information needed to answer that particular question.

---

# Dynamically enriching context

Sending all of the system's data with every request is not a good strategy.
Besides wasting processing power, there's an important factor:

**AI models have context limits (tokens).**

The larger the prompt, the higher the computational cost and the smaller the amount of history available for the conversation.

That's why this project adopted a strategy based on **intent detection**.
For every message received, the system first identifies what the user actually wants.

Examples:
- "How am I doing on the ranking?"
- "What challenges are available?"
- "How does the Strava integration work?"
- "How much is left to complete my challenge?"

After this classification, only the modules that are actually needed are loaded.

The flow works as follows:

```text
Usuário
      │
      ▼
Detecção de intenção
      │
      ▼
Seleciona os módulos necessários
      │
      ▼
Consulta APIs / banco de dados
      │
      ▼
Monta o contexto
      │
      ▼
Envia para o modelo
      │
      ▼
Resposta ao usuário
```

This approach keeps the context small, focused, and highly relevant.

---

# Calling APIs as needed

Each module can represent a different source of information.

For example:
- user profile;
- active challenges;
- ranking;
- available events;
- activity history.

In the demo project, these modules were simulated through local files, but in production they could query:
- REST APIs;
- databases;
- microservices;
- legacy systems;
- any other data source.

The model receives only the result of these queries, producing a contextualized response.

---

# Improving the experience with Cache and Streaming

Another important point was performance.
To avoid repeated calls to the same data sources, **caching** was implemented for the loaded modules.

This reduces response time and decreases the number of queries made to the backend.
In addition, responses are sent using **streaming**.

Instead of waiting for the entire text to be generated, the user already starts seeing the response immediately, providing a much more natural experience.

---

# The result

Even using a relatively small model running locally with Ollama, the results were consistent.

The system was able to:
- answer questions about the platform;
- answer user-specific questions;
- use only the data needed for each interaction;
- keep responses fast;
- decline out-of-scope questions when necessary;
- resist prompt manipulation attempts.

All of this without relying on a large cloud-hosted model.

---

# Conversation examples

## Checking user information

**User**

> How am I doing this month?

**Assistant**

> You've logged 142.8 km across 18 activities, with an average pace of 5:21 min/km. You're currently in 18th place out of 326 participants.

---

## Checking a challenge

**User**

> How much is left to complete the Winter Circuit 100K?

**Assistant**

> You have 31.6 km left to reach your goal. The challenge ends on 07/31 and you're currently in 12th place.

---

## Discovering new events

**User**

> Is there any new challenge coming up?

**Assistant**

> Yes. Still in July there are the Sprint 5K and Ultra Weekend challenges. In August, the August 150K kicks off, with a medal, t-shirt, and coupon as rewards.

---

## Questions about the platform

**User**

> How does the sync with Strava work?

**Assistant**

> Once you connect your account, activities are automatically synced and counted toward the platform's compatible challenges.

---

# Conclusion

One of the main takeaways from this project is that response quality doesn't depend exclusively on model size.

When the application feeds the model a clear, organized, and highly relevant context, smaller models can produce surprisingly good results.

More important than using the largest available LLM is building an architecture capable of providing exactly the information the model needs at each interaction.

In this scenario, techniques such as intent detection, dynamic context loading, API calls, caching, and streaming become just as important as the AI model itself.

This project demonstrates exactly that idea: **a simple model, fed the right information at the right time, can deliver an extremely efficient and natural conversation experience.**

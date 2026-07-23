---
title: "Circuit: virtual running championships integrated with Strava inside the Nexo platform"
category: projetos
project: nexo
excerpt: "Circuit is Nexo's first module: it lets companies create and manage virtual running championships for their customers, with automatic result tracking via Strava webhooks."
slug: circuit-virtual-championships-integrated-with-strava
published_at: 2026-07-14
tags:
  - strava
  - championships
  - webhook
  - running
  - privacy
  - security
seo_title: "Circuit: virtual running championships integrated with Strava inside the Nexo platform"
seo_description: "Meet Circuit, the first module of the Nexo platform: management of virtual running championships with automatic result tracking via Strava webhooks, rate-limit guardrails, and security with JWT and 2FA."
seo_keywords:
  - strava
  - virtual championships
  - webhook
  - running
  - nexo
  - circuit
---

# Circuit: virtual running championships integrated with Strava inside the Nexo platform

This is the first post about **Nexo** (https://www.nexosync.com.br/), a new platform I'm building.

## What is Nexo

Nexo is a **platform** that brings together several independent **modules (subsystems)**, each responsible for a specific business capability. The modules share authentication, permissions, infrastructure, and common components, but can evolve independently — each with its own release pace, without blocking the others.

The stack behind Nexo combines **NodeJS**, **PHP**, **Laravel**, **Docker**, and **DDD** as the approach for organizing the domain.

## The first module: Circuit

**Circuit** (https://circuit.nexosync.com.br/) is Nexo's first module and is currently in its **validation phase**.

![[circuit-telainicial.png|Circuit home screen]]

It lets a company manage **virtual running championships** with its own customers, without relying on spreadsheets or manual processes to track who is meeting the goals.

![[circuit-telausuario.png|Circuit user screen]]

## Championship configuration

On the admin screen, the championship manager can configure:

- **Total kilometers** to be covered within a time period;
- **Activity count**, when the criterion is number of runs rather than distance;
- **Athlete level** as a filter (beginner, moderate, or advanced);
- A required **region** where the run must take place;
- **Minimum pace** required per activity;
- **Minimum kilometer rules** per valid activity.

This combination of rules makes it possible to build anything from simple accumulated-distance challenges to more elaborate championships segmented by athlete profile.

![[circuit-eventos.gif|Circuit events]]

## Result tracking via Strava webhook

Circuit doesn't ask users to manually report their results. Tracking happens automatically, through the **Strava webhook**:

```text
Athlete finishes a run
        │
        ▼
Strava fires the webhook
        │
        ▼
Circuit fetches the activity details
        │
        ▼
Activity is validated against the championship rules
        │
        ▼
Result is recorded
```

As soon as the person finishes a run, the webhook is sent to the system and a query about the activity is performed to validate whether it meets the championship's rules (region, minimum pace, minimum kilometers).

![[circuit-telaatividades.png|Circuit activities screen]]

The entire integration faithfully follows the rules defined by Strava, both the [brand and usage guidelines](https://developers.strava.com/guidelines/) and the [API policy](https://www.strava.com/legal/api_policy).

### Guardrails against rate limiting

Strava enforces **daily request limits**, and fetching each activity's details consumes that quota. To avoid hitting the limit, Circuit has dedicated guardrails and a smart fetching strategy that balances two competing goals:

- validating results within the remaining quota availability;
- ensuring an event finishes successfully, even under rate-limit pressure.

## Data transparency and privacy

The system makes it clear to users what data is collected and how it's displayed. For participants in the same challenge, only the **summarized value** of each competitor is visible — not the raw activity history.

Other important points of the data policy:

- collected data is **deleted after 30 days**;
- users can **revoke access** to their information at any time;
- the privacy policy details how data is handled and ensures users' rights.

## Admin area security

The admin area is protected by **JWT** authentication, and login requires **2FA** — an extra layer to protect the system even in the event of a password leak.

## What's next

Circuit is still in its validation phase, but it already brings together the core pieces needed to run running championships end to end: flexible rule configuration, automatic tracking via Strava, API rate-limit guardrails, and a transparent data policy for users.

As Nexo's first module, it also serves as a reference for the next ones: the same foundation of authentication, permissions, and infrastructure, evolving independently according to each business's needs.

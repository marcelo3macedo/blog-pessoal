---
title: "Capstone Thesis: Fault Tolerance in Microservices — Evaluating Techniques Under CPU and Memory Bottlenecks"
category: projetos
project: tcc-tolerancia-falhas-microsservicos
excerpt: "A case study comparing availability and latency of CPU-bound and memory-bound microservices, with and without retries, circuit breakers, load balancing, and scaling."
slug: capstone-thesis-fault-tolerance-in-microservices
published_at: 2026-07-14
tags:
  - capstone-thesis
  - microservices
  - fault-tolerance
  - resilience
  - availability
seo_title: "Capstone Thesis — Fault Tolerance in Microservices Under CPU and Memory Bottlenecks"
seo_description: "Summary of a capstone thesis evaluating fault tolerance techniques — retries, circuit breakers, load balancing, and scaling — in CPU-bound and memory-bound microservices."
seo_keywords:
  - fault tolerance
  - microservices
  - circuit breaker
  - availability
  - resilience
---

# Capstone Thesis: Fault Tolerance in Microservices Under CPU and Memory Bottlenecks

This project gathers the capstone thesis for the Software Engineering MBA (USP/Esalq), written by **Marcelo Alberico Macedo**, under the supervision of **Ariel da Silva Dias** (USP/ICMC). The work evaluates, through a controlled case study, the real impact of fault tolerance techniques on the availability and latency of microservices — comparing scenarios with a processing bottleneck (**CPU-bound**) and a memory bottleneck (**memory-bound**).

## Abstract

Microservices architecture is widely adopted because it enables resilience under high-demand conditions, but that resilience only materializes when fault tolerance techniques are applied properly. This work evaluated the relevance of these techniques in high CPU and memory usage scenarios, through load tests in a controlled environment, monitoring availability and latency.

The central finding: applying the right techniques made it possible to reach the availability standards recommended by the industry — but an inadequate choice (applying retries and exponential backoff without considering the nature of the bottleneck) actually **worsened** availability in the CPU-bound scenario. In other words, fault tolerance isn't a checklist of techniques to apply blindly: you need to understand whether the system is CPU-bound or memory-bound before choosing a strategy.

## Methodology

The study simulated requests against two versions of a Python/Flask API, both communicating via HTTP with an external service called "Receiver":

- **CPU-bound version**: on every request, it runs a processing-intensive recursive calculation for 5 seconds.
- **Memory-bound version**: on every request, it allocates 1 MB of RAM and holds it for 5 seconds.

Communication parameters: up to 10 attempts, a 20-second timeout, up to 8 instances. The tests ran in Docker containers limited to **0.5 CPU and 100 MB of RAM**, with the simulator firing 2,000 requests across 22 batches (mostly 50 requests/min, with two spikes of 500 requests to simulate overload). Grafana monitored system health, I/O latency, total requests, and errors.

Each version of the API was tested under three scenarios:

1. **No fault tolerance techniques**
2. **With retry techniques** (attempts, time limit, exponential backoff)
3. **With resource management techniques** (circuit breakers, load balancing, scaling)

## Results

### CPU-bound

| Scenario | Accepted | Denied | Availability | Average latency |
|---|---|---|---|---|
| No techniques | 1794 | 206 | 91.26% | 1.4s |
| Retries | 1116 | 884 | 57.1% | 18s |
| Resource management | 1986 | 14 | 99.28% | 1.1s |

In the CPU-bound scenario, applying retries and exponential backoff **worsened** availability (from 91.26% to 57.1%) and drove latency up by more than 1,185%. The additional attempts simply piled more processing load onto a system that was already at its CPU limit. Only the combination of circuit breakers + load balancing + scaling solved the problem, raising availability to 99.28%.

### Memory-bound

| Scenario | Accepted | Denied | Availability | Average latency |
|---|---|---|---|---|
| No techniques | 1041 | 959 | 68.3% | 0.3s |
| Retries | 1514 | 486 | 75.7% | 0.7s |
| Resource management | 1990 | 10 | 99.5% | 0.3s |

In the memory-bound scenario, on the other hand, retries helped (availability rose from 68.3% to 75.7%), but still fell short of the minimum practiced by the industry. Once again, it was the combination of circuit breakers, load balancing, and scaling that brought the system to 99.5% availability, without penalizing latency.

## Final Considerations

In both scenarios, the advanced techniques — **circuit breakers, load balancing, and scaling** — were the only ones able to reach the industry's minimum availability standard without hurting latency. Retries applied in isolation, without considering the type of bottleneck the system has, can have an adverse effect — as was made clear in the CPU-bound scenario, where the technique further overloaded an already scarce resource.

The practical conclusion: **assessing the type of load the system faces (CPU or memory) is a prerequisite for choosing the right fault tolerance technique** — applying the wrong technique can be worse than applying none at all. As future directions, the work points to investigating hybrid systems (CPU and memory simultaneously) and more flexible strategies that reduce resource consumption without sacrificing availability.

## Practical demonstration

The circuit breaker, retry, and guaranteed-delivery concepts discussed in this thesis have a practical implementation, built with Node.js, RabbitMQ, and a Dead Letter Queue, in the post [Demonstrating Resilience in Microservices with Circuit Breaker and Guaranteed Delivery](/posts/en/demonstrating-resilience-in-microservices-with-circuit-breaker).

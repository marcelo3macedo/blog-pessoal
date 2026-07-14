---
title: "TCC: Tolerância a Falhas em Microsserviços — Avaliando Técnicas sob Gargalos de CPU e Memória"
category: projetos
project: tcc-tolerancia-falhas-microsservicos
project_description: "Trabalho de conclusão de curso (MBA em Engenharia de Software, USP/Esalq) que avalia, por meio de um estudo de caso, o impacto de técnicas de tolerância a falhas na disponibilidade e na latência de microsserviços sob gargalos de CPU e de memória."
project_tags:
  - Python
  - Flask
  - Docker
  - Grafana
  - Resiliência
excerpt: "Estudo de caso que compara disponibilidade e latência de microsserviços CPU-bound e memory-bound, com e sem retentativas, disjuntores de circuito, balanceamento de carga e escalonamento."
slug: tcc-tolerancia-falhas-em-microsservicos
published_at: 2026-07-14
tags:
  - tcc
  - microsservicos
  - tolerancia-a-falhas
  - resiliencia
  - disponibilidade
seo_title: "TCC — Tolerância a Falhas em Microsserviços sob Gargalos de CPU e Memória"
seo_description: "Resumo do TCC que avalia técnicas de tolerância a falhas — retentativas, disjuntores de circuito, balanceamento de carga e escalonamento — em microsserviços CPU-bound e memory-bound."
seo_keywords:
  - tolerancia a falhas
  - microsservicos
  - circuit breaker
  - disponibilidade
  - resiliencia
---

# TCC: Tolerância a Falhas em Microsserviços sob Gargalos de CPU e Memória

Este projeto reúne o Trabalho de Conclusão de Curso do MBA em Engenharia de Software (USP/Esalq), escrito por **Marcelo Alberico Macedo**, com orientação de **Ariel da Silva Dias** (USP/ICMC). O trabalho avalia, por meio de um estudo de caso controlado, o impacto real de técnicas de tolerância a falhas na disponibilidade e na latência de microsserviços — comparando cenários com gargalo de processamento (**CPU-bound**) e gargalo de memória (**memory-bound**).

## Resumo

A arquitetura de microsserviços é amplamente adotada por permitir resiliência em situações de alta demanda, mas essa resiliência só se concretiza com a aplicação adequada de técnicas de tolerância a falhas. Este trabalho avaliou a relevância dessas técnicas em cenários de alto uso de CPU e de memória, através de testes de carga em ambiente controlado, monitorando disponibilidade e latência.

O resultado central: a aplicação correta das técnicas permitiu atingir os padrões de disponibilidade recomendados pela indústria — mas a escolha inadequada (aplicar retentativas e recuo exponencial sem considerar a natureza do gargalo) chegou a **piorar** a disponibilidade no cenário CPU-bound. Ou seja, tolerância a falhas não é uma lista de técnicas a aplicar cegamente: é preciso entender se o sistema é limitado por CPU ou por memória antes de escolher a estratégia.

## Metodologia

O estudo simulou requisições contra duas versões de uma API em Python/Flask, ambas se comunicando via HTTP com um serviço externo chamado "Recebedor":

- **Versão CPU-bound**: a cada requisição, executa um cálculo recursivo intensivo em processamento por 5 segundos.
- **Versão memory-bound**: a cada requisição, aloca 1 MB em RAM e o mantém por 5 segundos.

Parâmetros de comunicação: até 10 tentativas, timeout de 20 segundos, até 8 instâncias. Os testes rodaram em containers Docker limitados a **0,5 CPU e 100 MB de RAM**, com o simulador disparando 2.000 requisições em 22 blocos (a maioria de 50 requisições/min, com dois picos de 500 requisições para simular sobrecarga). Grafana monitorou saúde do sistema, latência de I/O, total de requisições e erros.

Cada versão da API foi testada em três cenários:

1. **Sem técnicas de tolerância a falhas**
2. **Com técnicas de retentativas** (tentativas, limite de tempo, recuo exponencial)
3. **Com técnicas de gerenciamento de recursos** (disjuntores de circuito, balanceamento de carga, escalonamento)

## Resultados

### CPU-bound

| Cenário | Aceitas | Negadas | Disponibilidade | Latência média |
|---|---|---|---|---|
| Sem técnicas | 1794 | 206 | 91,26% | 1,4s |
| Retentativas | 1116 | 884 | 57,1% | 18s |
| Gerenciamento de recursos | 1986 | 14 | 99,28% | 1,1s |

No cenário CPU-bound, aplicar retentativas e recuo exponencial **piorou** a disponibilidade (de 91,26% para 57,1%) e disparou a latência em mais de 1.185%. As novas tentativas apenas empilharam mais carga de processamento sobre um sistema que já estava no limite de CPU. Só o conjunto de disjuntores de circuito + balanceamento de carga + escalonamento resolveu o problema, elevando a disponibilidade para 99,28%.

### Memory-bound

| Cenário | Aceitas | Negadas | Disponibilidade | Latência média |
|---|---|---|---|---|
| Sem técnicas | 1041 | 959 | 68,3% | 0,3s |
| Retentativas | 1514 | 486 | 75,7% | 0,7s |
| Gerenciamento de recursos | 1990 | 10 | 99,5% | 0,3s |

Já no cenário memory-bound, retentativas ajudaram (disponibilidade subiu de 68,3% para 75,7%), mas ainda ficaram abaixo do mínimo praticado pela indústria. Novamente, foi o conjunto de disjuntores de circuito, balanceamento de carga e escalonamento que levou o sistema a 99,5% de disponibilidade, sem penalizar a latência.

## Considerações Finais

Em ambos os cenários, as técnicas avançadas — **disjuntores de circuito, balanceamento de carga e escalonamento** — foram as únicas capazes de atingir o padrão mínimo de disponibilidade da indústria sem prejudicar a latência. Já retentativas aplicadas isoladamente, sem considerar o tipo de gargalo do sistema, podem ter efeito adverso — como ficou evidente no cenário CPU-bound, em que a técnica sobrecarregou ainda mais um recurso já escasso.

A conclusão prática: **avaliar o tipo de carga do sistema (CPU ou memória) é pré-requisito para escolher a técnica de tolerância a falhas certa** — aplicar a técnica errada pode ser pior do que não aplicar nenhuma. Como direções futuras, o trabalho aponta a investigação de sistemas híbridos (CPU e memória simultaneamente) e estratégias mais flexíveis que reduzam o consumo de recursos sem abrir mão da disponibilidade.

## Demonstração prática

Os conceitos de disjuntor de circuito, retentativas e garantia de entrega discutidos no TCC têm uma implementação prática, com Node.js, RabbitMQ e Dead Letter Queue, no post [Demonstração de Resiliência em Microsserviços com Circuit Breaker e Garantia de Entrega](/posts/resiliencia-em-microsservicos-com-circuit-breaker).

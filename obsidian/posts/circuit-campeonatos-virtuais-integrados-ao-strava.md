---
title: "Circuit: campeonatos virtuais integrados ao Strava dentro da plataforma Nexo"
category: projetos
project: nexo
project_description: "Plataforma que reúne diversos módulos (subsistemas) independentes, cada um responsável por uma capacidade específica do negócio. Os módulos compartilham autenticação, permissões, infraestrutura e componentes comuns, mas evoluem de forma independente."
project_tags:
  - NodeJS
  - PHP
  - Laravel
  - Docker
  - DDD
excerpt: "O Circuit é o primeiro módulo do Nexo: permite que empresas criem e gerenciem campeonatos virtuais de corrida para seus clientes, com contabilização automática via webhook do Strava."
slug: circuit-campeonatos-virtuais-integrados-ao-strava
published_at: 2026-07-14
tags:
  - strava
  - campeonatos
  - webhook
  - corrida
  - privacidade
  - seguranca
seo_title: "Circuit: campeonatos virtuais integrados ao Strava dentro da plataforma Nexo"
seo_description: "Conheça o Circuit, primeiro módulo da plataforma Nexo: gerenciamento de campeonatos virtuais de corrida com contabilização automática via webhook do Strava, guardrails de rate limit e segurança com JWT e 2FA."
seo_keywords:
  - strava
  - campeonatos virtuais
  - webhook
  - corrida
  - nexo
  - circuit
---

# Circuit: campeonatos virtuais integrados ao Strava dentro da plataforma Nexo

Este é o primeiro post sobre o **Nexo** (https://www.nexosync.com.br/), uma nova plataforma que estou desenvolvendo.

## O que é o Nexo

O Nexo é uma **plataforma** que reúne diversos **módulos (subsistemas)** independentes, cada um responsável por uma capacidade específica do negócio. Os módulos compartilham autenticação, permissões, infraestrutura e componentes comuns, mas podem evoluir de forma independente — cada um com seu próprio ritmo de release, sem travar os demais.

A stack por trás do Nexo combina **NodeJS**, **PHP**, **Laravel**, **Docker** e **DDD** como abordagem de organização de domínio.

## O primeiro módulo: Circuit

O **Circuit** (https://circuit.nexosync.com.br/) é o primeiro módulo do Nexo e está atualmente em **fase de validação**.

![[circuit-telainicial.png]]

Ele permite que uma empresa gerencie **campeonatos virtuais de corrida** com seus próprios clientes, sem depender de planilhas ou processos manuais para acompanhar quem está cumprindo as metas.

![[circuit-telausuario.png]]

## Configuração de campeonatos

Na tela administrativa, o gestor do campeonato pode configurar:

- **Total de KM** a ser percorrido em um período de tempo;
- **Contagem de atividades**, quando o critério é número de corridas e não distância;
- **Nível do atleta** como filtro (iniciante, moderado ou avançado);
- **Região** obrigatória onde a corrida precisa ser realizada;
- **Pace mínimo** exigido por atividade;
- **Regras de KM mínimo** por atividade válida.

Essa combinação de regras permite montar desde desafios simples de distância acumulada até campeonatos mais elaborados, segmentados por perfil de atleta.

![[circuit-eventos.gif]]

## Contabilização via webhook do Strava

O Circuit não pede que o usuário informe manualmente seus resultados. A contabilização acontece de forma automática, através do **webhook do Strava**:

```text
Atleta finaliza uma corrida
        │
        ▼
Strava dispara o webhook
        │
        ▼
Circuit consulta os detalhes da atividade
        │
        ▼
Atividade é validada contra as regras do campeonato
        │
        ▼
Resultado é contabilizado
```

Assim que a pessoa termina uma corrida, o webhook é enviado ao sistema e uma consulta sobre a atividade é realizada para validar se ela atende às regras do campeonato (região, pace mínimo, KM mínimo).

![[circuit-telaatividades.png]]

Toda a integração segue fielmente as regras definidas pelo Strava, tanto as [diretrizes de marca e uso](https://developers.strava.com/guidelines/) quanto a [política da API](https://www.strava.com/legal/api_policy).

### Guardrails contra rate limit

O Strava impõe **limites diários de requisições**, e buscar os detalhes de cada atividade consome essa cota. Para evitar que o limite seja atingido, o Circuit conta com guardrails dedicados e uma estratégia inteligente de busca, que equilibra dois objetivos que competem entre si:

- validar os resultados dentro da disponibilidade de cota restante;
- garantir que um evento seja finalizado com sucesso, mesmo sob pressão de limite.

## Transparência e privacidade dos dados

O sistema deixa claro para o usuário quais dados são coletados e como eles são exibidos. Para os participantes de um mesmo desafio, fica visível apenas o **valor sumarizado** de cada concorrente — não o histórico bruto de atividades.

Outros pontos importantes da política de dados:

- os dados coletados são **deletados após 30 dias**;
- o usuário pode **revogar o acesso** às suas informações a qualquer momento;
- a política de privacidade detalha o tratamento dos dados e assegura os direitos dos usuários.

## Segurança da área administrativa

A área administrativa é protegida por autenticação **JWT**, e o login exige **2FA** — uma camada adicional para proteger o sistema mesmo em cenários de vazamento de senha.

## O que vem a seguir

O Circuit ainda está em fase de validação, mas já reúne as peças centrais para operar campeonatos de corrida de ponta a ponta: configuração flexível de regras, contabilização automática via Strava, guardrails de limite de API e uma política de dados transparente para os usuários.

Como primeiro módulo do Nexo, ele também serve de referência para os próximos: mesma base de autenticação, permissões e infraestrutura, evoluindo de forma independente conforme a necessidade de cada negócio.

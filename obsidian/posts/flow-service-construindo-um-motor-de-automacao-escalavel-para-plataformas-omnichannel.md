---
title: "Flow Service: construindo um motor de automação escalável para plataformas omnichannel"
category: arquitetura
excerpt: Descubra como projetar um Flow Service capaz de executar automações complexas em uma plataforma omnichannel sem bloquear filas, mantendo alta disponibilidade, escalabilidade e baixo acoplamento. Neste artigo exploramos uma arquitetura baseada em estados, RabbitMQ, módulos independentes e execução assíncrona.
slug: flow-service-construindo-um-motor-de-automacao-escalavel-para-plataformas-omnichannel
published_at: 2026-07-21
project: flow-service
project_description: "Execuções de automações através de fluxos pré-determinados por canais para plataformas omnichannel"
project_tags:
  - Next.js
  - TypeScript
  - React Flow
  - Arquitetura
  - Node.js
tags:
  - arquitetura
  - consistência
  - qualidade
  - microsservicos
seo_title: "Flow Service: construindo um motor de automação escalável para plataformas omnichannel"
seo_description: Descubra como projetar um Flow Service capaz de executar automações complexas em uma plataforma omnichannel sem bloquear filas, mantendo alta disponibilidade, escalabilidade e baixo acoplamento. Neste artigo exploramos uma arquitetura baseada em estados, RabbitMQ, módulos independentes e execução assíncrona.
seo_keywords:
  - arquitetura
  - consistência
  - qualidade
  - microsservicos
---
Nos artigos anteriores vimos como o webhook é recebido, validado e encaminhado para processamento de forma segura. Nesse momento, a plataforma já identificou a origem da mensagem, validou sua autenticidade, localizou o canal correspondente e criou (ou recuperou) o atendimento associado ao usuário.

É a partir dessa etapa que entra em ação o **Flow Service**, responsável por executar a automação configurada para aquele canal.

Em uma plataforma omnichannel, receber uma mensagem é apenas o início da jornada.

Uma simples mensagem enviada pelo WhatsApp pode desencadear dezenas de ações diferentes: validar dados do cliente, consultar APIs externas, atualizar sistemas internos, enviar respostas automáticas e registrar informações para atendimento e analytics.

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

Executar todo esse fluxo dentro de um único consumidor parece simples, mas basta uma API externa demorar alguns segundos para reduzir drasticamente o throughput da fila.

Neste artigo, vamos focar exclusivamente na arquitetura desse serviço: como ele controla o estado da execução, percorre o fluxo de automação e executa cada etapa de forma escalável, mesmo quando algumas delas dependem de APIs externas ou operações de longa duração.

Para outras abordagem do serviço, acesse:
- Projeto [ Flow Service](/projetos/flow-service).
- Veja o [funcionamento detalhado do Flow Service](/posts/flow-service-funcionamento-detalhado).

---

# Infraestrutura

Para este cenário, vamos considerar o **Flow Service** executando em **2 Tasks no AWS ECS Fargate**, cada uma com **1 vCPU e 2 GB de memória**. Essa configuração oferece capacidade suficiente para iniciar o processamento com folga e permite escalar horizontalmente conforme a demanda aumenta.

Como referência, essa infraestrutura é capaz de processar aproximadamente **200 mensagens por segundo** (cerca de **12.000 mensagens por minuto**), considerando que a maior parte dos nós do fluxo realiza operações rápidas e que chamadas mais demoradas são desacopladas para workers especializados.

A comunicação entre o Validation Service e o Flow Service ocorre através do **RabbitMQ**, utilizando uma fila do tipo **Work Queue**, onde cada mensagem é entregue para apenas um consumidor.

A escolha pelo RabbitMQ se deve principalmente às características desse tipo de processamento:
- Baixa latência para consumo e publicação;
- ACK manual, garantindo que a mensagem só seja removida da fila após o processamento;
- Controle de **Prefetch**, permitindo limitar quantas mensagens cada instância processa simultaneamente;
- Facilidade para implementar filas de retry e Dead Letter Queue (DLQ);
- Excelente observabilidade, com métricas de filas, consumidores, taxa de publicação, acknowledgements e uso de memória.

Embora o **Amazon SQS** também seja uma alternativa válida, ele oferece menos flexibilidade para esse cenário. Recursos como controle refinado de consumidores (Prefetch), roteamento avançado e mecanismos de retry costumam exigir implementações adicionais utilizando outros serviços da AWS, como SNS e múltiplas filas.

---

# Processamento por Node

Embora o Flow Service seja responsável por controlar a execução da automação, ele **não executa diretamente operações demoradas**.

Sempre que um node representa uma integração externa ou uma tarefa de longa duração, ele apenas agenda sua execução em uma fila específica e libera imediatamente o consumidor.

Essa abordagem impede que chamadas lentas reduzam o throughput da fila principal.

## Arquitetura

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

# Execução de Nodes Assíncronos

Nem todos os nodes possuem o mesmo tempo de processamento.  

Enquanto alguns executam em poucos milissegundos (como IF, Switch ou cálculos), outros dependem de APIs externas e podem levar vários segundos para concluir.

Se todo esse processamento fosse executado pelo mesmo consumidor, ele permaneceria bloqueado aguardando o retorno de cada API, reduzindo drasticamente o throughput da fila.

Para evitar esse problema, o Flow Service utiliza **consumidores especializados por tipo de node**.

---
# Organização dos módulos

Embora todos pertençam ao **Flow Service**, cada integração possui seu próprio módulo e seu próprio consumidor.

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

  
Cada módulo é responsável apenas pela execução do seu tipo de node.

---

# Benefícios

Cada integração possui seu próprio worker e sua própria fila.
Isso significa que um problema em uma API externa não afeta as demais integrações.

Por exemplo:

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

Fica imediatamente visível que a lentidão está concentrada na integração com IA.
Enquanto isso:

- CPF continua sendo validado normalmente;
- consultas na Receita Federal continuam sendo executadas;
- atualização do CRM continua funcionando;
- novos fluxos continuam iniciando.

Apenas os fluxos que dependem do node **Consulta IA** aguardam sua vez.

---

# Monitoramento

Como cada tipo de node possui sua própria fila, torna-se simples identificar gargalos.

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

  
Nesse exemplo fica evidente que a lentidão está concentrada apenas na integração com IA. 

Os demais módulos continuam processando normalmente.
Essa separação facilita o monitoramento, o ajuste de Auto Scaling e a identificação de gargalos sem impactar o restante da plataforma.

---

# Uma evolução natural

Neste artigo, todos os consumidores pertencem ao mesmo **Flow Service**. Essa abordagem simplifica o desenvolvimento, reduz a quantidade de serviços para manter e costuma ser suficiente para a maioria dos cenários iniciais.

Entretanto, a arquitetura foi projetada para evoluir naturalmente.

À medida que o volume de mensagens aumenta ou determinadas integrações passam a exigir características específicas, como maior capacidade de processamento, bibliotecas próprias, timeouts diferentes ou recursos computacionais dedicados, esses consumidores podem ser extraídos para serviços independentes.

Como toda a comunicação acontece através do RabbitMQ, essa migração possui baixo impacto na arquitetura. O Flow Service continua publicando mensagens na mesma fila, enquanto apenas o consumidor responsável passa a ser executado em outro serviço.

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

Na prática, o motor de execução do fluxo permanece exatamente o mesmo. Apenas a responsabilidade de executar determinados nodes é movida para serviços especializados.

Essa estratégia permite iniciar o projeto com uma arquitetura simples e, conforme a plataforma cresce, evoluir para uma solução distribuída sem alterar contratos, filas ou o funcionamento do Flow Service.
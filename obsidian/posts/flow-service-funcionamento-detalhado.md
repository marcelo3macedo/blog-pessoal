---
title: "Flow Service: detalhes do funcionamento da automação de fluxos para plataformas omnichannel"
category: projetos
excerpt: Após identificar o atendimento e o fluxo de automação associado ao canal, o Flow Service passa a controlar toda a execução da automação.
slug: flow-service-funcionamento-detalhado
published_at: 2026-07-21
project: flow-service
project_description: Execuções de automações através de fluxos pré-determinados por canais para plataformas omnichannel
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
seo_title: "Flow Service: detalhes do funcionamento da automação de fluxos para plataformas omnichannel"
seo_description: Após identificar o atendimento e o fluxo de automação associado ao canal, o Flow Service passa a controlar toda a execução da automação.
seo_keywords:
  - arquitetura
  - consistência
  - qualidade
  - microsservicos
---
Nos artigos anteriores vimos como o webhook é recebido, validado e encaminhado para processamento de forma segura. Nesse momento, a plataforma já identificou a origem da mensagem, validou sua autenticidade, localizou o canal correspondente e criou (ou recuperou) o atendimento associado ao usuário.

É a partir dessa etapa que entra em ação o **Flow Service**, responsável por executar a automação configurada para aquele canal.

Neste artigo, vamos focar exclusivamente no funcionamento desse serviço, compreender quais ações ele realiza e como realiza.

---
# Funcionamento

]O fluxo de execução acontece da seguinte forma:
```text
Mensagem
         (fila flow.execute.queue)
                         │
                         ▼
                  Flow Service
                         │
                         ▼
        Carrega Flow (JSON) do Redis Cache (estrutura base -> react-flow)
                         │
                         ▼
      Flow vinculado ao Canal encontrado?
                  │                 │
                Não                Sim
                  │                 ▼
                  │          Busca INSTANCE
                  │                 │
                  │                 ▼
                  │     Primeira interação?
                  │          │          │
                  │        Sim         Não
                  │          │          │
                  │          ▼          ▼
                  │     Primeiro Node  Último Node
                  │                    executado
                  │          └──────┬───────┘
                  │                 ▼
                  │         Executa Módulo
                  │                 │
                  │                 ▼
                  │      Atualiza INSTANCE
                  │                 │
                  │                 ▼
                  │        Registra STEP
                  │                 │
                  │                 ▼
                  │      Analisa retorno
                  │                 │
                  │     ┌───────────┼────────────┐
                  │     │           │            │
                  │     ▼           ▼            ▼
                  │ Permanecer   Enviar      Próximo
                  │ no Node      Resposta      Node
                  │     │           │            │
                  │     │           ▼            ▼
                  │     │      Publica       Publica
                  │     │      mensagem      flow.execute
                  │     │      ao canal      novamente
                  │     │
                  ▼     ▼
                 Fim   Fim
```

## Recebimento da mensagem
Cada mensagem recebida pelo serviço contém todas as informações necessárias para localizar o atendimento correspondente:
- conteúdo da mensagem;
- tipo da mensagem (texto, imagem, áudio etc.);
- canal de origem;
- identificador do atendimento;
- remetente.  

Esses dados são suficientes para que o Flow Service descubra exatamente em qual ponto da automação aquele atendimento se encontra.

---
## Carregamento do fluxo
Cada canal possui um fluxo de automação associado.
Esse fluxo é armazenado como um **JSON**, seguindo uma estrutura semelhante ao **React Flow**, contendo:
- Nodes (etapas);
- Edges (ligações entre etapas);
- Configuração específica de cada node.  

Como esse fluxo sofre poucas alterações, ele permanece **cacheado** (REDIS), reduzindo consultas ao banco de dados.

---

## Recuperando o estado da execução
Após localizar o fluxo, o serviço verifica se aquele atendimento já iniciou uma automação.
Essa informação é obtida através da **INSTANCE**, responsável por armazenar o estado atual da execução.
A INSTANCE contém, por exemplo:
- ID do atendimento;
- node atual;
- variáveis acumuladas durante o fluxo;
- status da execução.
Se não existir uma INSTANCE, significa que é a primeira interação do usuário e o processamento começa pelo primeiro node do fluxo.

Caso contrário, a execução continua exatamente do ponto onde havia parado.

---
## Histórico de execução
Enquanto a INSTANCE representa o estado atual, a tabela **STEPS** registra todo o histórico da execução.
Cada passagem por um node gera um novo registro contendo informações como:
- node executado;
- horário;
- entrada recebida;
- saída produzida;
- alterações realizadas nas variáveis;
- tempo de execução;
- possíveis erros.

Esse histórico facilita auditoria, depuração e reprocessamentos.

---
## Execução dos módulos
O Flow Service não conhece a implementação de cada tipo de node. Ele apenas localiza o módulo correspondente e executa sua interface padrão.
Cada módulo é totalmente independente, seguindo princípios de baixo acoplamento e alta coesão.
Dependendo da configuração recebida no campo **data** do node, o módulo poderá:
- realizar cálculos;
- consultar banco de dados;
- alterar informações do atendimento;
- consumir APIs externas;
- enviar mensagens;
- manipular variáveis;
- executar regras de negócio.

---

## Resultado da execução
Independentemente do tipo do módulo, seu retorno possui sempre a mesma estrutura lógica.
Ele pode informar que:
- o fluxo deve permanecer no node atual;
- uma mensagem deve ser enviada ao cliente;
- variáveis precisam ser atualizadas;
- a execução deve seguir para outro node específico;
- o fluxo foi finalizado.
  
Essa padronização torna o motor de execução extremamente simples e desacoplado dos módulos.

---
## Descobrindo o próximo passo
Após executar o módulo, o Flow Service analisa o retorno.
Existem dois comportamentos possíveis.

### Permanecer no node atual
Alguns módulos representam estados de espera, como aguardar uma resposta do usuário.
Nesse caso, a INSTANCE é atualizada e a execução é encerrada naquele ponto.

Quando uma nova mensagem chegar, o processamento continuará exatamente desse mesmo node.

```text

Mensagem
↓
Node "Perguntar Nome"
↓
Aguardando resposta
↓
INSTANCE salva
↓
Fim

```

---
### Avançar para outro node

Quando o módulo indicar continuidade, o Flow Service consulta as **Edges** do fluxo para descobrir qual será o próximo node.
Caso o próprio módulo tenha informado um destino específico (por exemplo, em uma condição ou Switch), esse caminho possui prioridade.

Após determinar o próximo node, a INSTANCE é atualizada e uma nova mensagem é publicada na fila para continuar a execução.

```text

Node Atual
↓
Atualiza INSTANCE
↓
Descobre próximo Edge
↓
Publica novamente
↓
Flow Service continua execução

```

  
Esse modelo transforma cada etapa da automação em uma pequena unidade de trabalho, permitindo que o processamento seja distribuído entre diversas instâncias do serviço sem perder o contexto de cada atendimento.

---

# Organização do código
Como cada **node** possui um comportamento diferente, uma boa abordagem é utilizar uma arquitetura modular baseada no padrão **Strategy**, onde o Flow Service atua apenas como um orquestrador. Toda a regra de negócio fica encapsulada dentro dos módulos responsáveis por cada tipo de node.

Essa organização reduz o acoplamento, facilita a criação de novos nodes e evita alterações no motor principal sempre que uma nova funcionalidade é adicionada.
 
## Estrutura de pastas

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
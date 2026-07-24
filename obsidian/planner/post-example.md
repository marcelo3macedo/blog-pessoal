### 1. Cabeçalho & Metadados Técnicos

Logo abaixo do título, inclua uma caixa explicativa rápida de contexto:
- **Escopo:** Sistemas Distribuídos / Arquitetura Orientada a Eventos.
- **Linguagens e Stack:** TypeScript, Node.js (NestJS), AWS (SQS, Lambda), RabbitMQ.
- **Impacto de Negócio:** Aumento de disponibilidade de 97% para 99,99%.
- **Link para o Código:** Botão direto para o repositório PoC no GitHub.

---

### 2. O Problema e o Contexto de Negócio (The "Why")

Explique qual era a dor real do sistema antes da intervenção:

- Qual era o gargalo? (Ex: _Webhooks perdendo requisições em horários de pico_, _latência alta na resposta_, _banco de dados atingindo 100% de CPU_) .
- Por que a solução síncrona/legada anterior falhou?

---
### 3. A Arquitetura da Solução (Diagrama C4 Model)

Apresente visualmente como o sistema foi estruturado.
```
[Cliente/Webhook] ──> [API Gateway / Ingest] ──> [Fila Amazon SQS] ──> [Worker NestJS] ──> [Banco PostgreSQL]
```

_(No blog, este fluxo deve ser um diagrama vetorial interativo ou gerado via código)_.

---
### 4. Trade-offs e Análise de Decisão

Arquiteto de Software não escolhe tecnologia por "moda", mas por análise de prós e contras. Adicione uma tabela comparativa no post:

```
*Por que escolhemos Amazon SQS em vez de Apache Kafka para este cenário?*
```

```
*Quais foram os pontos negativos (trade-offs) aceitos pela equipe?*
```

---

### 5. Implementação Prática (Trechos de Código-Chave)

Não coloque o arquivo de código inteiro. Mostre apenas os blocos onde a **mágica arquitetural** acontece (ex: _a classe que implementa o Circuit Breaker_ ou _a lógica de gestão de Dead Letter Queues_).

---
### 6. Métricas, Resultados e Lições Aprendidas

Finalize com dados concretos do impacto:
- Queda no tempo de resposta (ex: _p99 reduzido em 350ms_).
- Economia financeira de infraestrutura.
- Gráficos comparativos de consumo de CPU/Memória sob teste de estresse (k6 / Artillery).
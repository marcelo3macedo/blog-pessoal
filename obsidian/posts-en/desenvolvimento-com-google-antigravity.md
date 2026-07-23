---
title: Development Workflow with Google Antigravity
category: agentes-ia
excerpt: AI-assisted development is evolving rapidly. Modern tools no longer act merely as code autocomplete. They are capable of planning features, implementing code, running tests, and more..
slug: google-antigravity-development-workflow
published_at: 2026-06-22
tags:
  - ai-agents
  - development
  - software
  - artificial-intelligence
seo_title: Development Workflow with Google Antigravity
seo_description: AI-assisted development is evolving rapidly. Modern tools no longer act merely as code autocomplete. They are capable of planning features, implementing code, running tests, and more..
seo_keywords:
  - ai-agents
  - development
  - software
  - artificial-intelligence
---
# Antigravity for Software Development: Planning, Execution, Multi-Agents, and Security

## Introduction

AI-assisted development is evolving rapidly.

Modern tools no longer act merely as code autocomplete. They are capable of:
- Planning features    
- Implementing code    
- Running tests    
- Fixing bugs    
- Analyzing architecture    
- Creating documentation    
- Coordinating multiple specialized agents
    
Antigravity follows this same proposal of turning AI into an active member of the development team.

Instead of merely answering questions, it acts as a system capable of planning, executing, and validating software tasks.

---

# Plan, Execute, and Test

A typical workflow within Antigravity can follow three stages:

## Planning

Before writing code, the agent analyzes:
- Existing architecture    
- Dependencies    
- Business rules    
- Impact of the change
    
Example:
```text
Criar autenticação JWT para API.
```

The agent first creates a plan:
1. Create middleware.
2. Create token generation service.    
3. Add configuration.    
4. Create tests.    
5. Update documentation.
    
---

## Execution

After the plan is approved, the agent:
- Creates files    
- Updates existing code    
- Generates migrations    
- Adjusts tests
    
---

## Testing

Finally:
- Runs unit tests    
- Runs integration tests    
- Analyzes coverage    
- Validates the build
    
The goal is to deliver a validated change, not just generate code.

---

# Available Models

Antigravity can use different models depending on the task.

## Model comparison

| Model                     | Cost       | Speed      | Quality   | Best Use               |
| ------------------------- | ---------- | ---------- | --------- | ---------------------- |
| Gemini Flash              | Low        | Very high  | Good      | Simple tasks           |
| Gemini Pro                | Medium     | High       | Very good | Daily development      |
| Claude Sonnet             | Medium     | High       | Excellent | Code and architecture  |
| Claude Opus               | High       | Medium     | Excellent | Complex problems        |
| GPT-5 (when available)    | Medium/High| High       | Excellent | General development    |

---

# Which model should you use?

## Level 1 — Simple tasks

Examples:
- Text tweaks    
- Simple CRUD    
- Small refactors    
- Basic unit tests    

### Recommended
- Gemini Flash
    
### Advantages
- Very cheap    
- Very fast   
### Disadvantages
- Less architectural depth    

---

## Level 2 — Medium tasks

Examples:
- APIs    
- Refactorings    
- Integrations    
- Bug fixes
    
### Recommended
- Gemini Pro    
- Claude Sonnet
    
### Advantages
- Great balance between cost and quality
    
### Disadvantages
- May fail on extremely complex problems
    
---

## Level 3 — Complex tasks

Examples:
- Distributed architecture    
- Large migrations    
- Security    
- Critical reviews
    
### Recommended
- Claude Opus
    
### Advantages
- Best reasoning capability
    
### Disadvantages
- Higher cost
    
---

# Development Modes

## Planning Mode

The agent doesn't change anything.

It only:
- Analyzes context    
- Creates a plan    
- Identifies risks    
- Suggests execution
    
Ideal for:
- Large features    
- Refactorings    
- Sensitive changes
    
---

## Fast Mode

The agent executes directly.

Ideal for:
- Small tweaks    
- Quick fixes    
- Repetitive tasks
    
---

# Generated Artifacts

During execution, Antigravity generates artifacts useful for auditing.

---

## Tasks

A structured list of activities.

Example:

```text
[ ] Criar endpoint
[ ] Criar service
[ ] Criar testes
[ ] Atualizar documentação
```

---

## Code Diff

Shows exactly what was changed.

Example:

```diff
+ Add JwtAuthenticationMiddleware
+ Add TokenService
- Remove LegacyAuth
```

---

## Terminal Logs

A complete execution history.

Example:

```text
Running tests...
Build succeeded
Coverage 91%
```

---

# Orchestrating Multiple Agents

One of the most interesting capabilities is the parallel execution of specialized agents.

---

## Agent Manager

A main agent coordinates the others.

Example:

```text
Agent Manager
├── Backend Agent
├── Frontend Agent
├── Database Agent
├── Security Agent
└── QA Agent
```

Each agent has:
- A specific goal    
- Specific context    
- Specific tools
    
---

## Practical Example

Implement social login.
The Agent Manager can delegate:

Backend Agent

```text
Implementar OAuth
```

Frontend Agent

```text
Criar tela de login
```

Database Agent

```text
Criar tabelas necessárias
```

Security Agent

```text
Validar riscos
```

QA Agent

```text
Criar testes
```

All in parallel.

---

# How to Write Good Prompts

A common mistake is to simply ask:

```text
Crie uma API de pagamentos.
```

Effective prompts have structure.

---

## Context

System information.

```text
Projeto em .NET 9.
Arquitetura Clean Architecture.
Banco PostgreSQL.
```

---

## Task

What needs to be done.

```text
Criar endpoint para cadastro de clientes.
```

---

## Constraints

Restrictions.

```text
Não utilizar Entity Framework.
Utilizar Dapper.
Seguir SOLID.
Cobertura mínima 80%.
```

---

## Success Criteria

How to validate success.

```text
Todos os testes devem passar.
Build sem warnings.
Endpoint documentado no Swagger.
```

---

## Complete Example

The more context and criteria provided, the better the results tend to be.

A weak prompt:

```text
Crie uma API de pagamentos.
```

Leaves unclear:
- Which technology to use    
- Which functionality to implement    
- Business rules    
- Request format    
- Validation criteria    
- Quality requirements
    
A more complete prompt:

```text
Context:

Projeto em .NET 9 utilizando Clean Architecture.

Estrutura atual:

- API
- Application
- Domain
- Infrastructure

Banco PostgreSQL.
Dapper para acesso a dados.
Swagger habilitado.
xUnit para testes.

Task:

Implementar endpoint de reembolso de pagamentos.

Criar rota:

POST /api/payments/refund

Criar toda a estrutura necessária:

- Controller
- Request DTO
- Response DTO
- Command
- Handler
- Repository
- Testes unitários
- Documentação Swagger

Request:

{
  "paymentId": "PAY-123456",
  "amount": 50.00,
  "reason": "Cliente desistiu da compra"
}

Campos obrigatórios:

- paymentId
- amount

Validações:

- paymentId não pode ser vazio
- amount deve ser maior que zero
- amount não pode ser maior que o valor original da transação
- pagamento deve existir
- pagamento deve estar aprovado
- pagamento não pode estar totalmente reembolsado

Retorno HTTP 200:

{
  "refundId": "REF-987654",
  "paymentId": "PAY-123456",
  "amount": 50.00,
  "status": "Approved"
}

Retorno HTTP 400 para:

- paymentId inválido
- valor inválido
- pagamento inexistente
- pagamento já reembolsado
- pagamento não elegível para reembolso

Retorno HTTP 404 para:

- transação não encontrada

Retorno HTTP 500 para:

- falhas inesperadas

Constraints:

- Utilizar Dapper
- Não utilizar Entity Framework
- Seguir SOLID
- Seguir CQRS
- Não criar lógica de negócio no Controller
- Todas as validações devem ficar na camada Application
- Repository apenas para acesso a dados
- Utilizar injeção de dependência
- Criar logs estruturados

Success Criteria:

- Build sem warnings
- Todos os testes passando
- Cobertura mínima de 80%
- Endpoint documentado no Swagger
- Sonar sem code smells críticos
- Nenhuma regra de negócio implementada no Controller
- Código aderente aos princípios SOLID
```

Notice that in this format the agent receives what is essentially a mini functional specification.

This reduces ambiguity, cuts down on rework, and significantly increases the chance that the result will be close to expected on the very first run.

# Security Controls

Agents hold a lot of power.
That's why protection mechanisms are essential.

---

## Guardrails
Define limits of behavior.

Example:

```text
Nunca apagar banco de produção.
```

---

## Broad Reach

Controls the scope of actions.

Example:

```text
Pode alterar apenas arquivos dentro de src/.
```

---

## Approval Gates

Require human approval.

Example:

```text
Alteração em infraestrutura
→ requer aprovação
```

---

# Policies

Policies allow controlling what agents can and cannot do.

---

## Allow List

Explicit permissions.

```text
Pode criar arquivos.
Pode executar testes.
Pode atualizar documentação.
```

---

## Deny List

Explicit restrictions.

```text
Não pode apagar banco.
Não pode alterar secrets.
Não pode publicar em produção.
```

---

# The .agents Structure

Projects can define agent behavior through the `.agents` folder.

---

## Rules

Global rules.

Example:

```text
Sempre seguir SOLID.
Sempre criar testes.
```

---

## Skills

Reusable capabilities.

Example:

```text
Criar API REST
Criar Migration
Criar Testes
```

---

## Workflows

Complete flows.

Example:

```text
Nova Feature

1. Planejar
2. Implementar
3. Testar
4. Revisar
5. Gerar documentação
```

---

# Conclusion

The future of development won't be based on a single agent writing code.

The trend is toward the use of multiple specialized agents working together, supervised by human developers.

Tools like Antigravity show a path where AI participates in the entire development cycle:
- Planning    
- Implementation    
- Testing    
- Review    
- Security
    

In this scenario, the differentiator is no longer just knowing how to program.

It becomes knowing how to orchestrate agents, define processes, write good prompts, and establish security controls capable of ensuring that the speed of AI does not compromise software quality.

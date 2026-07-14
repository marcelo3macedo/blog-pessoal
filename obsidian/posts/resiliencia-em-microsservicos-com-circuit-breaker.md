---
title: Demonstração de Resiliência em Microsserviços com Circuit Breaker e Garantia de Entrega
category: arquitetura
project: tcc-tolerancia-falhas-microsservicos
excerpt: Sistemas distribuídos inevitavelmente enfrentam falhas.Indisponibilidade de serviços externos, lentidão de rede, sobrecarga de infraestrutura e erros temporários fazem parte da realidade de qualquer ambiente de produção.
slug: resiliencia-em-microsservicos-com-circuit-breaker
published_at: 2026-06-25
tags:
  - arquitetura
  - circuit-breaker
  - resiliencia
seo_title: Demonstração de Resiliência em Microsserviços com Circuit Breaker e Garantia de Entrega
seo_description: Sistemas distribuídos inevitavelmente enfrentam falhas.Indisponibilidade de serviços externos, lentidão de rede, sobrecarga de infraestrutura e erros temporários fazem parte da realidade de qualquer ambiente de produção.
seo_keywords:
  - arquitetura
  - circuit-breaker
  - resiliencia
---

# Demonstração de Resiliência em Microsserviços com Circuit Breaker e Garantia de Entrega

Sistemas distribuídos inevitavelmente enfrentam falhas.

Indisponibilidade de serviços externos, lentidão de rede, sobrecarga de infraestrutura e erros temporários fazem parte da realidade de qualquer ambiente de produção.

Por esse motivo, arquiteturas modernas de microsserviços precisam ser projetadas considerando que falhas irão ocorrer.

O objetivo não é evitar falhas, mas garantir que o sistema continue operando mesmo quando parte dos componentes apresenta problemas.

Este projeto foi desenvolvido para demonstrar conceitos fundamentais de resiliência utilizando:

- Node.js    
- Docker Compose    
- RabbitMQ    
- Circuit Breaker    
- Dead Letter Queue (DLQ)    
- Retry automático    
- Processamento assíncrono
    

O cenário simula uma plataforma de pedidos onde um serviço recebe solicitações e outro realiza o processamento dos pagamentos através de uma integração externa sujeita a falhas.

Mesmo diante de erros, lentidão ou indisponibilidade temporária do provedor externo, o sistema continua operando e garante que nenhum pedido seja perdido.

Código fonte:
- https://github.com/marcelo3macedo/alem-do-script/tree/main/comunicacao-microservicos-com-circuit-breaker

---

# Objetivo da Demonstração

A proposta é demonstrar como microsserviços podem manter sua operação através da combinação de alguns padrões arquiteturais amplamente utilizados.

Durante a execução da simulação será possível observar:

- Comunicação assíncrona entre serviços    
- Desacoplamento através de filas    
- Circuit Breaker protegendo integrações instáveis    
- Reenfileiramento automático de mensagens    
- Dead Letter Queue    
- Retentativas automáticas    
- Garantia de entrega    
- Recuperação automática após falhas
    
---

# Arquitetura da Solução

A arquitetura foi construída utilizando serviços independentes que se comunicam exclusivamente através de filas.

```text
Orders Service
      ↓
RabbitMQ
      ↓
Payments Service
      ↓
External Gateway
```

O serviço de pedidos não possui qualquer dependência direta do serviço de pagamentos.

Isso significa que mesmo que o processamento esteja indisponível, os pedidos continuam sendo aceitos e armazenados na fila.

---

# Orders Service

Responsável por receber os pedidos.

Exemplo:

```json
{
  "orderId": "123",
  "amount": 150.00
}
```

Ao receber o pedido:

1. Valida os dados.    
2. Publica a mensagem na fila.    
3. Retorna sucesso ao cliente.
    

O processamento efetivo ocorre posteriormente.

---

# RabbitMQ

O RabbitMQ atua como camada de desacoplamento.

Seu papel é:
- Armazenar mensagens    
- Garantir entrega    
- Permitir retries    
- Absorver picos de carga
    
Mesmo que o serviço de pagamentos esteja indisponível temporariamente, as mensagens permanecem armazenadas.

---

# Payments Service

Responsável por consumir os pedidos e processar pagamentos.

Fluxo:

```text
Fila
   ↓
Consumer
   ↓
Gateway Externo
   ↓
Resultado
```

É neste ponto que as falhas simuladas ocorrem.

---

# Simulando Instabilidades

Para representar situações comuns em ambientes reais, foi criado um serviço externo com taxa de falha configurável.

Exemplos:

```text
70% de falha
```

ou

```text
5% de falha
```

Isso permite observar o comportamento da arquitetura sob diferentes níveis de instabilidade.

---

# O Problema Sem Proteção

Imagine o seguinte cenário:

```text
Gateway externo indisponível
```

Sem qualquer mecanismo de proteção:

```text
Pedido
  ↓
Timeout
  ↓
Nova tentativa
  ↓
Timeout
  ↓
Nova tentativa
```

O resultado seria:
- Acúmulo de requisições    
- Consumo excessivo de recursos    
- Tempo de resposta elevado    
- Efeito cascata entre serviços
    
---

# Circuit Breaker

Para evitar esse cenário, foi implementado o padrão Circuit Breaker.

O objetivo é interromper temporariamente novas chamadas quando um número excessivo de falhas é detectado.

---

## Estados do Circuit Breaker

### CLOSED

Funcionamento normal.

```text
Pedido
   ↓
Gateway
```

Todas as requisições são permitidas.

---

### OPEN

Após atingir o limite configurado de falhas consecutivas.

```text
Pedido
   ↓
Circuit Open
   ↓
Falha imediata
```

Nenhuma chamada é enviada ao gateway.

O sistema falha rapidamente e protege a integração externa.

---

### HALF_OPEN

Após o período de espera.

```text
Pedido teste
     ↓
Gateway
```

Se a chamada funcionar:

```text
HALF_OPEN → CLOSED
```

Se falhar:

```text
HALF_OPEN → OPEN
```

---

# Garantia de Entrega

Um dos objetivos principais da demonstração é garantir que nenhum pedido seja perdido.

Para isso foram utilizados três mecanismos.

---

## Mensagens Persistentes

Todas as mensagens são publicadas como persistentes.

```javascript
channel.sendToQueue(queue, buffer, {
  persistent: true
});
```

Isso garante sobrevivência mesmo após reinicializações do RabbitMQ.

---

## ACK Explícito

Uma mensagem somente é confirmada após processamento bem-sucedido.

```text
Sucesso
   ↓
ACK
```

Caso contrário:

```text
Falha
   ↓
NACK
```

---

## Dead Letter Queue

Mensagens problemáticas não retornam imediatamente para a fila principal.

Fluxo:

```text
Orders
   ↓
Falha
   ↓
DLQ
   ↓
Retry Queue
   ↓
Orders
```

Essa abordagem evita loops agressivos de reprocessamento.

---

# Resultado da Simulação

A execução teve duração aproximada de:

```text
115 segundos
```

Durante esse período:

| Métrica           | Valor |
| ----------------- | ----- |
| Pedidos enviados  | 20    |
| Tentativas totais | 66    |
| Aprovações        | 20    |
| Falhas            | 46    |
| Retries           | 46    |
| Pedidos perdidos  | 0     |

---

# O Que Isso Significa?

Apesar de:

```text
46 falhas
```

o resultado final foi:

```text
20 pedidos aprovados
```

Todos os pedidos chegaram ao destino.

Nenhuma mensagem foi perdida.

---

# Timeline da Simulação

## Fase 1 — Ambiente Instável

O gateway foi configurado com:

```text
70% de taxa de falha
```

Eventos observados:

```text
t+0s
Gateway instável
```

```text
t+9s
Circuit Breaker abre
```

```text
CLOSED → OPEN
```

A partir desse momento o sistema para de enviar requisições ao gateway.

---

## Primeira Tentativa de Recuperação

Após o timeout configurado:

```text
OPEN → HALF_OPEN
```

Uma requisição teste é executada.

O gateway ainda apresenta falhas.

Resultado:

```text
HALF_OPEN → OPEN
```

O sistema continua protegido.

---

## Fase 2 — Recuperação do Gateway

Em tempo de execução foi realizada uma alteração dinâmica:

```text
70% → 5%
```

de taxa de falha.

Sem reiniciar containers.

Sem interromper o ambiente.

---

## Reabertura e Fechamento

Após algumas tentativas bem-sucedidas:

```text
OPEN
   ↓
HALF_OPEN
   ↓
CLOSED
```

O Circuit Breaker volta ao estado normal.

---

# Evolução do Circuit Breaker

Durante toda a execução ocorreram diversas transições.

```text
CLOSED → OPEN
OPEN → HALF_OPEN
HALF_OPEN → OPEN
OPEN → HALF_OPEN
HALF_OPEN → CLOSED
```

Isso demonstra exatamente o comportamento esperado do padrão.

O circuito protege quando necessário e retorna automaticamente quando a dependência se recupera.

---

# O Papel da DLQ

Sem a Dead Letter Queue o comportamento seria:

```text
Falha
 ↓
Retry imediato
 ↓
Falha
 ↓
Retry imediato
```

Conhecido como:

```text
Retry Storm
```

Esse padrão pode derrubar sistemas inteiros.

Com DLQ:

```text
Falha
 ↓
Fila de Retry
 ↓
Aguardar 30 segundos
 ↓
Nova tentativa
```

O sistema ganha tempo para se recuperar.

---

# Benefícios Observados

A demonstração evidencia diversas vantagens arquiteturais.

### Desacoplamento

O serviço de pedidos continua operando mesmo quando o pagamento falha.

---

### Tolerância a Falhas

Problemas externos não derrubam a aplicação inteira.

---

### Proteção de Dependências

O Circuit Breaker evita sobrecarregar serviços já instáveis.

---

### Recuperação Automática

Não é necessária intervenção manual.

O sistema se recupera sozinho.

---

### Garantia de Entrega

Nenhuma mensagem é perdida.

Mesmo diante de dezenas de falhas.

---

### Escalabilidade

Novos consumers podem ser adicionados sem alterar a arquitetura.

---

# Lições Aprendidas

Em arquiteturas distribuídas, falhas não são exceções.

São eventos esperados.

Por isso padrões como:
- Circuit Breaker    
- Retry    
- Dead Letter Queue    
- Filas Persistentes    
- ACK/NACK
    
devem fazer parte do desenho arquitetural desde o início.

Esses mecanismos transformam falhas temporárias em atrasos controlados, evitando perda de dados e indisponibilidade sistêmica.

---

A simulação demonstrou como uma arquitetura baseada em microsserviços pode continuar funcionando mesmo diante de falhas severas em dependências externas.

Durante a execução, o gateway apresentou uma taxa de falha extremamente alta, o Circuit Breaker entrou em ação diversas vezes e dezenas de tentativas de processamento falharam.

Ainda assim, graças ao uso de filas persistentes, Dead Letter Queues, retries controlados e confirmação explícita de processamento, todos os pedidos foram entregues com sucesso.

Esse é exatamente o objetivo da resiliência em sistemas distribuídos:

> Não impedir que falhas aconteçam, mas garantir que o negócio continue funcionando apesar delas.
---
title: "Validation Service: garantindo a consistência dos dados de múltiplos canais em uma plataforma omnichannel"
category: arquitetura
excerpt: O Validation Service recebe eventos de entrada de diversos canais e garante que eles sejam válidos antes de encaminhá-los para os demais microserviços (atendimento, chatbot, CRM, analytics etc.).
slug: validation-service-garantindo-a-consistencia-dos-dados-de-multiplos-canais-em-uma-plataforma-omnichannel
published_at: 2026-07-20
tags:
  - arquitetura
  - consistência
  - qualidade
  - microsservicos
seo_title: "Validation Service: garantindo a consistência dos dados de múltiplos canais em uma plataforma omnichannel"
seo_description: O Validation Service recebe eventos de entrada de diversos canais e garante que eles sejam válidos antes de encaminhá-los para os demais microserviços (atendimento, chatbot, CRM, analytics etc.).
seo_keywords:
  - arquitetura
  - consistência
  - qualidade
  - microsservicos
---
# Validation Service: garantindo a consistência dos dados de múltiplos canais em uma plataforma omnichannel

Em plataformas omnichannel, milhares de mensagens chegam continuamente por diferentes canais como WhatsApp, Instagram, Facebook Messenger e Telegram.

Embora seja tentador realizar toda a lógica de negócio imediatamente após o recebimento do webhook, essa abordagem costuma gerar problemas de escalabilidade, disponibilidade e confiabilidade.

---

# Introdução

O **Validation Service** é um microserviço dedicado exclusivamente à **validação da entrada de dados** provenientes dos canais de comunicação.

Seu objetivo **não é interpretar mensagens, responder usuários ou executar regras de negócio**, mas garantir que tudo o que chega ao sistema seja legítimo antes de seguir para o restante da arquitetura.

Os eventos recebidos normalmente chegam através de webhooks de plataformas como:
- WhatsApp Business API (Meta)
- Instagram
- Facebook Messenger
- Telegram

Esse serviço atua como uma **camada de segurança**, impedindo que dados inválidos, adulterados ou provenientes de origens não autorizadas sejam propagados para outros microsserviços.

Após validar a autenticidade da requisição, a mensagem é publicada em uma fila para processamento assíncrono pelos serviços responsáveis por atendimento, chatbot, CRM, analytics e demais componentes da plataforma.

Sua responsabilidade termina exatamente nesse ponto.

---

# Responsabilidades do Validation Service

O Validation Service possui responsabilidades bem definidas.

Ele deve:
- receber webhooks públicos;
- validar a autenticidade da origem;
- validar o formato mínimo da mensagem;
- publicar o evento na fila;
- responder rapidamente ao provedor.

Ele **não deve**:
- consultar banco de dados;
- executar regras de negócio;
- chamar outros microsserviços;
- responder clientes finais;
- interpretar conteúdo da conversa.

---

# Rotas disponíveis

Como o serviço recebe webhooks de provedores externos, ele expõe poucas rotas HTTP.

| Método | Endpoint | Finalidade |
|---------|----------|------------|
| POST | `/webhooks/meta` | Recebimento de eventos da Meta |
| POST | `/webhooks/telegram` | Recebimento de eventos do Telegram |
| GET | `/health` | Verificação de saúde da aplicação |
| GET | `/ready` | Verificação de disponibilidade |

Por ser uma API exposta diretamente na Internet, toda requisição deve passar por validações de segurança.

## Webhooks da Meta

Para eventos provenientes da Meta, é realizada a validação da assinatura **HMAC** enviada nos cabeçalhos da requisição.

Somente após confirmar que a assinatura corresponde ao payload recebido, a mensagem é considerada válida.

Essa validação impede alterações no conteúdo durante a transmissão e garante que o webhook realmente foi enviado pela Meta.

## Webhooks do Telegram

Para o Telegram, a autenticação ocorre através do **Secret Token**, configurado durante o registro do webhook.

Caso o token recebido não corresponda ao esperado, a requisição é imediatamente descartada.

---

# Funcionamento

Ao receber um webhook da Meta ou do Telegram, o objetivo da API **não é processar toda a mensagem**, mas apenas confirmar que ela foi recebida com sucesso.

Após validar sua autenticidade, a mensagem é publicada em uma fila e o serviço responde imediatamente com **HTTP 200 OK**.

Essa abordagem oferece diversas vantagens.

## Evitar reenvios do webhook

Se a plataforma de origem não receber um `HTTP 200` dentro do tempo esperado, ela entende que a entrega falhou e realizará novas tentativas automaticamente.

Quanto maior o tempo de processamento, maior a quantidade de retransmissões.

---

## Reduzir mensagens duplicadas

Reenvios aumentam significativamente a chance de processamento duplicado.

Ao responder rapidamente, reduzimos naturalmente a necessidade de mecanismos complexos de idempotência.

---

## Absorver picos de tráfego

Durante campanhas promocionais ou horários de maior movimento, milhares de mensagens podem chegar simultaneamente.

Responder rapidamente impede que conexões HTTP permaneçam abertas aguardando processamento interno.

---

## Disponibilidade

Mesmo que um banco de dados ou outro microsserviço esteja lento ou indisponível, o recebimento dos webhooks continua funcionando normalmente, desde que a fila esteja operacional.
Isso reduz significativamente o impacto de falhas internas.

---

## Escalabilidade

Separar o recebimento do processamento permite escalar apenas os consumidores da fila conforme a demanda cresce.
Não há necessidade de aumentar a camada responsável pelo recebimento dos webhooks sempre que houver maior volume de mensagens.

---

# Fluxo da arquitetura

```text
Meta / Telegram

        │

        ▼

 Validation Service

        │

 Validação HMAC / Secret

        │

        ▼

    RabbitMQ

        │

        ▼

 Consumidores

        │

 ├── Atendimento
 ├── Chatbot
 ├── CRM
 └── Analytics

```


# Infraestrutura

Como exemplo, considere a seguinte infraestrutura hospedada na AWS.

| Componente         | Configuração                 |
| ------------------ | ---------------------------- |
| Validation Service | AWS ECS Fargate              |
| Tasks iniciais     | 2                            |
| Recursos por task  | 0.5 vCPU / 1 GB RAM          |
| RabbitMQ           | 2 vCPU / 4 GB RAM            |
| Auto Scaling       | Baseado em CPU e Queue Depth |
A seguir veremos como essa arquitetura se comporta em diferentes níveis de carga.

---

# Cenário 1 — 300 mensagens por segundo
Neste cenário, o volume de entrada é relativamente baixo e a infraestrutura opera com folga.

### Comportamento
- CPU das tasks em aproximadamente **45%**
- Fila praticamente vazia
- Baixa latência
- Processamento contínuo

```text
                300 msg/s
                    │
                    ▼
        Validation Service
           (2 Tasks ECS)
                    │
                    ▼
              RabbitMQ
                    │
                    ▼
             Consumidores

Fila ≈ 0 mensagens
```

Neste cenário não há necessidade de escalar a aplicação.

---

# Cenário 2 — 800 mensagens por segundo

Com o aumento da carga, a fila começa a crescer temporariamente.
O Auto Scaling identifica dois indicadores importantes:
- CPU acima de **70%**
- Queue Depth superior a **5.000 mensagens**

Automaticamente o ECS aumenta o número de instâncias do Validation Service de **2 para 4 Tasks**.

### Resultado
- CPU retorna para aproximadamente **50%**
- A fila reduz gradualmente
- RabbitMQ continua apenas armazenando mensagens temporariamente

```text
               800 msg/s
                    │
                    ▼
      Validation Service
          (4 Tasks ECS)
                    │
                    ▼
              RabbitMQ
                    │
                    ▼
             Consumidores

Fila

5.000
3.200
1.800
900
120
```

A fila funciona apenas como um buffer temporário até que os consumidores acompanhem novamente a velocidade de entrada.

---

# Cenário 3 — 2.000 mensagens por segundo

Neste cenário ocorre um pico elevado de mensagens.

O Auto Scaling aumenta automaticamente o Validation Service para **8 Tasks**, mantendo o recebimento dos webhooks estável.
A partir desse ponto, o comportamento depende da velocidade dos consumidores.

## Consumidores rápidos
Quando a taxa de consumo acompanha a taxa de publicação, o RabbitMQ permanece praticamente vazio.

```text
Entrada

2.000 msg/s

        │
        ▼

Validation Service
    (8 Tasks)

        │
        ▼

RabbitMQ

        │
        ▼

Consumidores

2.000 msg/s

Fila

200
350
150
220

(quase sempre vazia)
```

Nesse cenário:
- A memória do RabbitMQ permanece baixa.
- A fila é utilizada apenas como buffer.
- A latência continua reduzida.

---

## Consumidores lentos
Agora considere consumidores processando apenas **500 mensagens por segundo**.

```text
Entrada

2.000 msg/s

        │
        ▼

Validation Service

        │
        ▼

RabbitMQ

        │
        ▼

Consumidores

500 msg/s

Fila

10.000

↓

30.000

↓

80.000

↓

150.000 mensagens
```

Como a produção é maior que o consumo, a fila cresce continuamente.
Consequentemente, o RabbitMQ passa a utilizar mais memória.

```text
RAM

50%

↓

70%

↓

85%

↓

90%
```

Quando o limite configurado é atingido, o broker ativa automaticamente o mecanismo de proteção de memória.

```text
Memory Alarm

↓

Paging

↓

Mensagens passam
a ser gravadas em disco
```

Mesmo durante o **Paging**:
- O broker continua aceitando novas mensagens.
- Os produtores continuam publicando normalmente.
- Os consumidores continuam processando a fila.
- As mensagens mais antigas permanecem armazenadas em disco.

Assim que houver memória disponível novamente:

```text
Paging

↓

Desativado

↓

Mensagens voltam
para RAM
```

Esse mecanismo permite que o RabbitMQ absorva grandes picos de tráfego sem perda de mensagens.

---

# Por que utilizar RabbitMQ?

O principal problema resolvido pelo Validation Service é a **distribuição de trabalho (Work Queue)**.
Cada mensagem precisa:
- ser validada apenas uma vez;
- ser consumida por apenas uma instância;
- possuir baixa latência;
- permitir controle refinado dos consumidores.

RabbitMQ foi projetado exatamente para esse tipo de cenário.

---

# Por que não utilizar Amazon SQS?

O Amazon SQS também atenderia ao problema.

Entretanto, algumas funcionalidades do RabbitMQ tornam sua utilização mais interessante nesse contexto.

## Prefetch

No RabbitMQ é possível limitar exatamente quantas mensagens cada consumidor recebe simultaneamente.

```text
prefetch = 20
```

Isso evita que uma instância fique sobrecarregada enquanto outras permanecem ociosas.

No SQS esse controle é mais limitado, sendo baseado na quantidade de mensagens buscadas por requisição (`MaxNumberOfMessages`).

---

## Roteamento

RabbitMQ possui um mecanismo extremamente flexível baseado em Exchanges e Routing Keys.

```text
instagram.*

↓

Fila Instagram

telegram.*

↓

Fila Telegram
```

No SQS normalmente seria necessário combinar SNS com múltiplas filas para obter comportamento semelhante.

---

## Latência

RabbitMQ normalmente trabalha com latências de poucos milissegundos.

```text
RabbitMQ

≈ poucos milissegundos
```

Enquanto isso, o SQS costuma apresentar latências maiores.

```text
Amazon SQS

≈ dezenas de milissegundos
```

Embora essa diferença não seja determinante para webhooks, o RabbitMQ tende a responder mais rapidamente.

---

## Observabilidade

Outro diferencial importante é sua interface administrativa.
Ela permite acompanhar facilmente:
- mensagens prontas;
- mensagens não confirmadas;
- publish/s;
- ack/s;
- consumers;
- utilização de memória;
- paging;
- crescimento das filas.

Essa visibilidade facilita bastante a operação da plataforma.

---

# Por que não utilizar Kafka?

Kafka resolve um problema diferente.
Ele foi criado para plataformas de **streaming de eventos**, onde diversos consumidores precisam processar exatamente o mesmo evento.

Por exemplo:

```text
Mensagem validada

↓

CRM

↓

Analytics

↓

Data Lake

↓

Machine Learning

↓

Chatbot
```

Nesse cenário Kafka é excelente.
Entretanto, o Validation Service possui um fluxo muito mais simples.

```text
Mensagem

↓

Validar

↓

Fim
```

Cada mensagem precisa ser processada apenas uma única vez por um único consumidor.
Nesse contexto, Kafka adicionaria complexidade desnecessária.

---

# Complexidade operacional do Kafka

Além disso, utilizar Kafka implicaria administrar diversos componentes adicionais:

- Brokers
- Partições
- Replicação
- Consumer Groups
- Offsets
- Retenção
- Segmentos de Log

Toda essa infraestrutura faz sentido para plataformas orientadas a eventos em larga escala, mas seria um excesso para uma fila dedicada exclusivamente à validação de webhooks.

---

# Conclusão

O Validation Service atua como a primeira camada de defesa de uma plataforma omnichannel.

Ao concentrar exclusivamente a validação dos webhooks, responder rapidamente aos provedores e desacoplar o processamento através do RabbitMQ, a arquitetura ganha:
- Maior disponibilidade
- Menor acoplamento
- Melhor escalabilidade
- Maior capacidade de absorver picos de tráfego
- Facilidade de operação e monitoramento

Esse padrão é amplamente utilizado em sistemas distribuídos de alta disponibilidade e representa uma abordagem simples, eficiente e robusta para lidar com grandes volumes de mensagens provenientes de múltiplos canais.
---
title: "Construindo um Chat Inteligente com IA Local: menos modelo, mais contexto"
category: desenvolvimento-web
excerpt: Quando pensamos em um chat com Inteligência Artificial para um sistema, normalmente imaginamos um modelo gigantesco respondendo qualquer pergunta. Na prática, o objetivo costuma ser muito mais específico.
slug: circuit-chat-assistente-de-desafios-de-corrida
published_at: 2026-07-08
tags:
  - inteligencia-artificial
  - desafios
  - corrida
  - conversação
  - agentes-ia
seo_title: "Construindo um Chat Inteligente com IA Local: menos modelo, mais contexto"
seo_description: Quando pensamos em um chat com Inteligência Artificial para um sistema, normalmente imaginamos um modelo gigantesco respondendo qualquer pergunta. Na prática, o objetivo costuma ser muito mais específico.
seo_keywords:
  - inteligencia-artificial
  - desafios
  - corrida
  - modelo
---
# Construindo um Chat Inteligente com IA Local: menos modelo, mais contexto

Quando pensamos em um chat com Inteligência Artificial para um sistema, normalmente imaginamos um modelo gigantesco respondendo qualquer pergunta. Na prática, o objetivo costuma ser muito mais específico.

Neste projeto, o desejo do cliente era simples:
- responder dúvidas sobre o funcionamento da plataforma;    
- responder perguntas relacionadas aos próprios dados do usuário, como desafios ativos, ranking, atividades e progresso;    
- entregar respostas rápidas, naturais e confiáveis.
    
Em vez de utilizar um modelo extremamente grande hospedado em um serviço externo, a solução foi construída utilizando **gpt-oss executando localmente através do Ollama**.

O resultado foi bastante satisfatório.

Isso demonstra que, quando o contexto é bem organizado, nem sempre é necessário utilizar o maior modelo disponível para oferecer uma excelente experiência ao usuário.

## Link do projeto
Acesse: https://github.com/marcelo3macedo/simple-chatbot-with-ollama-and-apis

---

# Modelos de IA não conhecem o seu sistema

Esse é um dos conceitos mais importantes ao desenvolver aplicações com IA.

Um modelo de linguagem não conhece:
- quem é o usuário;    
- quais dados existem no banco;    
- quais desafios ele está participando;    
- seu ranking;    
- suas atividades recentes;    
- regras específicas da plataforma.
    
Sem essas informações, a IA responderá utilizando apenas o conhecimento adquirido durante o treinamento, produzindo respostas genéricas ou simplesmente incorretas.

A solução consiste em **enriquecer cada solicitação enviada ao modelo** com as informações necessárias para responder aquela pergunta.

---

# Enriquecendo o contexto dinamicamente

Enviar todos os dados do sistema em toda requisição não é uma boa estratégia.
Além de desperdiçar processamento, existe um fator importante:

**modelos de IA possuem limites de contexto (tokens).**

Quanto maior o prompt, maior o custo computacional e menor a quantidade de histórico disponível para a conversa.

Por isso, neste projeto foi adotada uma estratégia baseada em **detecção de intenção**.
A cada mensagem recebida, o sistema primeiro identifica o que o usuário realmente deseja.

Exemplos:
- "Como estou no ranking?"    
- "Quais desafios estão disponíveis?"    
- "Como funciona a integração com o Strava?"    
- "Quanto falta para completar meu desafio?"    

Depois dessa classificação, apenas os módulos realmente necessários são carregados.

O fluxo funciona da seguinte forma:

```text
Usuário
      │
      ▼
Detecção de intenção
      │
      ▼
Seleciona os módulos necessários
      │
      ▼
Consulta APIs / banco de dados
      │
      ▼
Monta o contexto
      │
      ▼
Envia para o modelo
      │
      ▼
Resposta ao usuário
```

Essa abordagem mantém o contexto pequeno, objetivo e altamente relevante.

---

# Chamando APIs conforme a necessidade

Cada módulo pode representar uma fonte diferente de informação.

Por exemplo:
- perfil do usuário;    
- desafios ativos;    
- ranking;    
- eventos disponíveis;    
- histórico de atividades.    

No projeto de demonstração esses módulos foram simulados através de arquivos locais, mas em produção eles podem consultar:
- APIs REST;    
- bancos de dados;    
- microsserviços;    
- sistemas legados;    
- qualquer outra fonte de dados.
    

O modelo recebe apenas o resultado dessas consultas, produzindo uma resposta contextualizada.

---

# Melhorando a experiência com Cache e Streaming

Outro ponto importante foi o desempenho.
Para evitar chamadas repetidas às mesmas fontes de dados, foi implementado **cache** para os módulos carregados.

Isso reduz o tempo de resposta e diminui a quantidade de consultas realizadas ao backend.
Além disso, as respostas são enviadas utilizando **streaming**.

Em vez de esperar o texto inteiro ser gerado, o usuário já começa a visualizar a resposta imediatamente, proporcionando uma experiência muito mais natural.

---

# O resultado

Mesmo utilizando um modelo relativamente pequeno executando localmente com Ollama, os resultados foram consistentes.

O sistema conseguiu:
- responder perguntas sobre a plataforma;    
- responder perguntas específicas do usuário;    
- utilizar apenas os dados necessários em cada interação;    
- manter respostas rápidas;    
- recusar perguntas fora do escopo quando necessário;    
- resistir a tentativas de manipulação do prompt.
    

Tudo isso sem depender de um grande modelo hospedado na nuvem.

---

# Exemplos de conversa

## Consultando informações do usuário

**Usuário**

> Como estou indo esse mês?

**Assistente**

> Você acumulou 142,8 km em 18 atividades, com ritmo médio de 5:21 min/km. Atualmente está em 18º lugar entre 326 participantes.

---

## Consultando um desafio

**Usuário**

> Quanto falta para completar o Circuit Inverno 100K?

**Assistente**

> Faltam 31,6 km para atingir sua meta. O desafio termina em 31/07 e você está atualmente na 12ª posição.

---

## Descobrindo novos eventos

**Usuário**

> Tem algum desafio novo chegando?

**Assistente**

> Sim. Ainda em julho há os desafios Sprint 5K e Ultra Weekend. Em agosto começa o Agosto 150K, com medalha, camiseta e cupom como premiação.

---

## Perguntas sobre a plataforma

**Usuário**

> Como funciona a sincronização com o Strava?

**Assistente**

> Após conectar sua conta, as atividades são sincronizadas automaticamente e contabilizadas nos desafios compatíveis da plataforma.

---

# Conclusão

Uma das principais lições deste projeto é que a qualidade das respostas não depende exclusivamente do tamanho do modelo.

Quando a aplicação entrega ao modelo um contexto claro, organizado e altamente relevante, modelos menores podem produzir resultados surpreendentemente bons.

Mais importante do que utilizar o maior LLM disponível é construir uma arquitetura capaz de fornecer exatamente as informações que o modelo precisa em cada interação.

Nesse cenário, técnicas como detecção de intenção, carregamento dinâmico de contexto, chamadas de APIs, cache e streaming tornam-se tão importantes quanto o próprio modelo de IA.

Esse projeto demonstra justamente essa ideia: **um modelo simples, alimentado com informações corretas no momento certo, pode oferecer uma experiência de conversa extremamente eficiente e natural.**
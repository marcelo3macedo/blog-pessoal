---
title: "Fundamentos da AWS: Os Serviços Mais Utilizados no Dia a Dia"
category: infraestrutura
excerpt: A Amazon Web Services (AWS) é atualmente uma das plataformas de computação em nuvem mais utilizadas do mundo. Empresas de todos os tamanhos utilizam AWS para hospedar aplicações, bancos de dados, APIs, arquivos, microsserviços e sistemas críticos.
slug: fundamentos-da-aws-servicos-mais-utilizados
published_at: 2026-06-22
tags:
  - infraestrutura
  - aws
seo_title: "Fundamentos da AWS: Os Serviços Mais Utilizados no Dia a Dia"
seo_description: A Amazon Web Services (AWS) é atualmente uma das plataformas de computação em nuvem mais utilizadas do mundo. Empresas de todos os tamanhos utilizam AWS para hospedar aplicações, bancos de dados, APIs, arquivos, microsserviços e sistemas críticos.
seo_keywords:
  - infraestrutura
  - aws
---
# Fundamentos da AWS: Os Serviços Mais Utilizados no Dia a Dia

A Amazon Web Services (AWS) é atualmente uma das plataformas de computação em nuvem mais utilizadas do mundo.

Empresas de todos os tamanhos utilizam AWS para hospedar aplicações, bancos de dados, APIs, arquivos, microsserviços e sistemas críticos.

Sua popularidade se deve a alguns fatores:
- Alta disponibilidade    
- Escalabilidade    
- Segurança    
- Presença global    
- Modelo de pagamento sob demanda    
- Grande quantidade de serviços especializados
    

Um dos maiores diferenciais da AWS é a flexibilidade.

Uma mesma aplicação pode ser construída de diversas formas dependendo do custo, desempenho, disponibilidade e complexidade desejados.

---

# Visão Geral de uma Arquitetura Comum

Imagine uma aplicação web moderna:

```text
Usuário
   |
   v
Route53
   |
   v
Load Balancer
   |
   v
ECS Service
   |
   v
Containers Docker
   |
   v
RDS
```

Além disso:

```text
Arquivos -> S3
Processamentos -> Lambda
```

Essa arquitetura é extremamente comum em empresas que utilizam microsserviços.

---

# S3 (Simple Storage Service)

O S3 é o serviço de armazenamento de arquivos da AWS.
Ele funciona como um enorme repositório de objetos.

Você pode armazenar:
- Imagens    
- PDFs    
- Vídeos    
- Backups    
- Arquivos estáticos    
- Logs    

---

## Exemplo

Imagine um sistema de e-commerce.
Quando o usuário envia uma foto de produto:

```text
produto.jpg
```

A aplicação salva o arquivo no S3.
O banco de dados armazena apenas:

```text
https://bucket.s3.amazonaws.com/produto.jpg
```

---

## Benefícios

- Alta durabilidade    
- Baixo custo    
- Escalável praticamente sem limites    
- Integração com CDN
    
---

# Route 53

O Route 53 é o serviço de DNS da AWS.
Ele traduz nomes amigáveis para endereços de infraestrutura.

Exemplo:

```text
api.minhaempresa.com
```

para

```text
load-balancer.amazonaws.com
```

---

## Exemplo

Usuário acessa:

```text
https://api.minhaempresa.com
```

O Route 53 responde:

```text
Esse domínio aponta para o Load Balancer X
```

A partir daí a requisição segue para a aplicação.

---

# ECS (Elastic Container Service)

O ECS é o serviço de orquestração de containers da AWS.
Ele permite executar aplicações Docker sem precisar gerenciar servidores manualmente.

---

## Exemplo

Uma API .NET:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0
```

Gera uma imagem Docker.
Essa imagem é enviada para a AWS.

O ECS executa os containers automaticamente.

---
## Benefícios

- Escalabilidade automática    
- Alta disponibilidade    
- Atualizações controladas    
- Integração com Load Balancer
    
---
# Docker Images

Antes do ECS executar uma aplicação, ela precisa estar empacotada.

É aí que entram as imagens Docker.

Uma imagem contém:
- Aplicação    
- Dependências    
- Configurações   
- Runtime
    
---
## Fluxo

```text
Código
   ↓
Docker Build
   ↓
Imagem
   ↓
Registry (ECR)
   ↓
ECS
```

---

## Exemplo

Uma API .NET:

```bash
docker build -t payment-api .
```

Gera uma imagem.
Essa imagem é publicada no ECR.

Depois o ECS utiliza essa imagem para criar containers.

---

# ECS Services

O Service é responsável por manter a quantidade desejada de containers executando.

---

## Exemplo

Configuração:

```text
Desired Count = 3
```

O ECS garante que existam sempre:

```text
API 1
API 2
API 3
```

Se um container cair:

```text
API 2 morreu
```

O ECS cria outro automaticamente.

---

# Escalamento no ECS

O ECS pode aumentar ou reduzir containers automaticamente.

---

## Exemplo

Configuração:

```text
Mínimo: 2
Máximo: 10
```

Quando a CPU atingir:

```text
80%
```

O ECS cria novos containers.

```text
2 -> 4 -> 6 -> 8
```

Quando o tráfego diminui:

```text
8 -> 6 -> 4 -> 2
```

Isso reduz custos.

---

# ECS Routing

Uma dúvida muito comum:

> Como o HTTPS chega até meu container?

A resposta normalmente envolve um Load Balancer.

---

## Fluxo completo

```text
Usuário
   ↓
Route53
   ↓
Application Load Balancer
   ↓
ECS Service
   ↓
Container
```

---

## Exemplo

Usuário acessa:

```text
https://api.minhaempresa.com/clientes
```

O fluxo ocorre assim:

### 1. DNS

O Route 53 encontra:

```text
api.minhaempresa.com
```

---

### 2. Load Balancer

Recebe a conexão HTTPS.

Certificado SSL:

```text
AWS Certificate Manager
```

---

### 3. Regras de Roteamento

Exemplo:

```text
/clientes
```

→ Container da API de Clientes

```text
/pagamentos
```

→ Container da API de Pagamentos

---

### 4. ECS

O Load Balancer encaminha para um container saudável.

```text
payment-api-container-3
```

---

# Lambda

Lambda é o serviço serverless da AWS.

Você envia apenas uma função.

A AWS executa quando necessário.

---

## Exemplo

Sempre que um arquivo for enviado ao S3:

```text
produto.jpg
```

Uma Lambda é acionada.

Ela:
- Redimensiona imagem    
- Gera thumbnail    
- Atualiza banco    

Tudo sem servidores dedicados.

---

## Benefícios

- Escala automaticamente    
- Cobrança por execução    
- Não exige gerenciamento de servidores    

---

# RDS (Relational Database Service)

O RDS é o serviço gerenciado de banco de dados relacional.

Suporta:
- PostgreSQL    
- MySQL    
- MariaDB    
- SQL Server    
- Oracle    

---

## Exemplo

Uma aplicação de pagamentos pode armazenar:

```text
Clientes
Pagamentos
Pedidos
Reembolsos
```

em um banco PostgreSQL hospedado no RDS.

---

## Benefícios

- Backup automático    
- Alta disponibilidade    
- Monitoramento    
- Atualizações gerenciadas
    
---

# Exemplo Completo de Arquitetura

Imagine um SaaS de gestão comercial.

Fluxo:

```text
Usuário
    ↓
Route53
    ↓
Load Balancer
    ↓
ECS Service
    ↓
Container Docker
    ↓
RDS
```

Arquivos:

```text
Usuário envia PDF
      ↓
S3
```

Processamento:

```text
Upload
   ↓
Lambda
   ↓
Extrair informações
```

Escalamento:

```text
Mais acessos
   ↓
Mais containers ECS
```

Tudo acontecendo automaticamente.

---

# Resumo

| Serviço          | Função                       |
| ---------------- | ---------------------------- |
| S3               | Armazenamento de arquivos    |
| Route 53         | DNS                          |
| ECS              | Execução de containers       |
| ECS Service      | Gerenciamento dos containers |
| ECS Auto Scaling | Escalamento automático       |
| Load Balancer    | Distribuição de tráfego      |
| Docker Image     | Pacote da aplicação          |
| Lambda           | Execução serverless          |
| RDS              | Banco de dados relacional    |

---

Grande parte das arquiteturas modernas na AWS é construída combinando poucos serviços fundamentais.

Uma aplicação típica utiliza:
- Route 53 para DNS    
- Load Balancer para entrada HTTPS    
- ECS para executar containers Docker    
- RDS para persistência de dados    
- S3 para armazenamento de arquivos    
- Lambda para automações e processamento de eventos
    
Dominar esses componentes já permite compreender a arquitetura da maioria dos sistemas hospedados na AWS e fornece uma excelente base para evoluir para soluções mais avançadas envolvendo microsserviços, mensageria, observabilidade e arquiteturas distribuídas.
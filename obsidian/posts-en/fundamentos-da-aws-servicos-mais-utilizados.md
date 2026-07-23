---
title: "AWS Fundamentals: The Most Commonly Used Services in Daily Practice"
category: infraestrutura
excerpt: Amazon Web Services (AWS) is currently one of the most widely used cloud computing platforms in the world. Companies of all sizes use AWS to host applications, databases, APIs, files, microservices, and critical systems.
slug: aws-fundamentals-most-used-services
published_at: 2026-06-22
tags:
  - infrastructure
  - aws
seo_title: "AWS Fundamentals: The Most Commonly Used Services in Daily Practice"
seo_description: Amazon Web Services (AWS) is currently one of the most widely used cloud computing platforms in the world. Companies of all sizes use AWS to host applications, databases, APIs, files, microservices, and critical systems.
seo_keywords:
  - infrastructure
  - aws
---
# AWS Fundamentals: The Most Commonly Used Services in Daily Practice

Amazon Web Services (AWS) is currently one of the most widely used cloud computing platforms in the world.

Companies of all sizes use AWS to host applications, databases, APIs, files, microservices, and critical systems.

Its popularity is due to a few factors:
- High availability    
- Scalability    
- Security    
- Global presence    
- Pay-as-you-go pricing model    
- A large number of specialized services
    

One of AWS's biggest advantages is flexibility.

The same application can be built in many different ways depending on the desired cost, performance, availability, and complexity.

---

# Overview of a Common Architecture

Imagine a modern web application:

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

In addition:

```text
Arquivos -> S3
Processamentos -> Lambda
```

This architecture is extremely common in companies that use microservices.

---

# S3 (Simple Storage Service)

S3 is AWS's file storage service.
It works as a huge object repository.

You can store:
- Images    
- PDFs    
- Videos    
- Backups    
- Static files    
- Logs    

---

## Example

Imagine an e-commerce system.
When the user uploads a product photo:

```text
produto.jpg
```

The application saves the file to S3.
The database only stores:

```text
https://bucket.s3.amazonaws.com/produto.jpg
```

---

## Benefits

- High durability    
- Low cost    
- Practically unlimited scalability    
- CDN integration
    
---

# Route 53

Route 53 is AWS's DNS service.
It translates friendly names into infrastructure addresses.

Example:

```text
api.minhaempresa.com
```

to

```text
load-balancer.amazonaws.com
```

---

## Example

The user accesses:

```text
https://api.minhaempresa.com
```

Route 53 responds:

```text
Esse domínio aponta para o Load Balancer X
```

From there the request continues to the application.

---

# ECS (Elastic Container Service)

ECS is AWS's container orchestration service.
It allows you to run Docker applications without having to manage servers manually.

---

## Example

A .NET API:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0
```

Generates a Docker image.
That image is uploaded to AWS.

ECS runs the containers automatically.

---
## Benefits

- Automatic scaling    
- High availability    
- Controlled updates    
- Load Balancer integration
    
---
# Docker Images

Before ECS can run an application, it needs to be packaged.

That's where Docker images come in.

An image contains:
- The application    
- Dependencies    
- Configuration   
- Runtime
    
---
## Flow

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

## Example

A .NET API:

```bash
docker build -t payment-api .
```

Generates an image.
That image is published to ECR.

Then ECS uses that image to create containers.

---

# ECS Services

The Service is responsible for keeping the desired number of containers running.

---

## Example

Configuration:

```text
Desired Count = 3
```

ECS guarantees that there are always:

```text
API 1
API 2
API 3
```

If a container goes down:

```text
API 2 morreu
```

ECS creates another one automatically.

---

# Scaling in ECS

ECS can increase or decrease the number of containers automatically.

---

## Example

Configuration:

```text
Mínimo: 2
Máximo: 10
```

When CPU reaches:

```text
80%
```

ECS creates new containers.

```text
2 -> 4 -> 6 -> 8
```

When traffic decreases:

```text
8 -> 6 -> 4 -> 2
```

This reduces costs.

---

# ECS Routing

A very common question:

> How does HTTPS reach my container?

The answer usually involves a Load Balancer.

---

## Complete flow

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

## Example

The user accesses:

```text
https://api.minhaempresa.com/clientes
```

The flow happens like this:

### 1. DNS

Route 53 finds:

```text
api.minhaempresa.com
```

---

### 2. Load Balancer

Receives the HTTPS connection.

SSL certificate:

```text
AWS Certificate Manager
```

---

### 3. Routing Rules

Example:

```text
/clientes
```

→ Customer API container

```text
/pagamentos
```

→ Payments API container

---

### 4. ECS

The Load Balancer forwards the request to a healthy container.

```text
payment-api-container-3
```

---

# Lambda

Lambda is AWS's serverless service.

You only submit a function.

AWS runs it when needed.

---

## Example

Whenever a file is uploaded to S3:

```text
produto.jpg
```

A Lambda function is triggered.

It:
- Resizes the image    
- Generates a thumbnail    
- Updates the database    

All without dedicated servers.

---

## Benefits

- Scales automatically    
- Pay per execution    
- No server management required    

---

# RDS (Relational Database Service)

RDS is the managed relational database service.

It supports:
- PostgreSQL    
- MySQL    
- MariaDB    
- SQL Server    
- Oracle    

---

## Example

A payments application might store:

```text
Clientes
Pagamentos
Pedidos
Reembolsos
```

in a PostgreSQL database hosted on RDS.

---

## Benefits

- Automatic backups    
- High availability    
- Monitoring    
- Managed updates
    
---

# Complete Architecture Example

Imagine a business management SaaS.

Flow:

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

Files:

```text
Usuário envia PDF
      ↓
S3
```

Processing:

```text
Upload
   ↓
Lambda
   ↓
Extrair informações
```

Scaling:

```text
Mais acessos
   ↓
Mais containers ECS
```

All happening automatically.

---

# Summary

| Service          | Function                       |
| ---------------- | ------------------------------- |
| S3               | File storage    |
| Route 53         | DNS                          |
| ECS              | Container execution       |
| ECS Service      | Container management |
| ECS Auto Scaling | Automatic scaling       |
| Load Balancer    | Traffic distribution      |
| Docker Image     | Application package          |
| Lambda           | Serverless execution          |
| RDS              | Relational database    |

---

Most modern AWS architectures are built by combining a handful of fundamental services.

A typical application uses:
- Route 53 for DNS    
- Load Balancer for HTTPS entry    
- ECS to run Docker containers    
- RDS for data persistence    
- S3 for file storage    
- Lambda for automation and event processing
    
Mastering these components already makes it possible to understand the architecture of most systems hosted on AWS, and it provides an excellent foundation for moving on to more advanced solutions involving microservices, messaging, observability, and distributed architectures.

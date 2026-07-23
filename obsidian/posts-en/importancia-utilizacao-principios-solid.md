---
title: Does SOLID still matter? Yes. And maybe more than ever in the age of AI.
category: qualidade-software
excerpt: AI tools are transforming the way we develop software. Today it's possible to generate controllers, services, tests, SQL queries, and even complete features in just a few minutes.
slug: does-solid-still-matter-in-the-age-of-ai
published_at: 2026-06-18
tags:
  - software
  - quality
  - architecture
seo_title: Does SOLID still matter? Yes. And maybe more than ever in the age of AI
seo_description: AI tools are transforming the way we develop software. Today it's possible to generate controllers, services, tests, SQL queries, and even complete features in just a few minutes.
seo_keywords:
  - quality
  - software
  - architecture
---
# Does SOLID still matter? Yes. And maybe more than ever in the age of AI.

AI tools are transforming the way we develop software.

Today it's possible to generate controllers, services, tests, SQL queries, and even complete features in just a few minutes.

But there's a problem:

> Fast code without structure quickly becomes technical debt.

AI accelerates code production, but it doesn't eliminate the need for a healthy architecture.

In practice, the more code that gets generated, the more important it becomes to have principles that keep the project organized, predictable, and easy to evolve.

This is exactly the scenario where the SOLID principles remain extremely relevant.

---
## Why does SOLID matter (even more so with AI)?

When a project follows SOLID:
- The code is more predictable. 
- Responsibilities are clear.    
- Changes have controlled impact.    
- Tests are simpler.    
- Code review is faster.    
- AI itself generates better suggestions.
    
When a project doesn't follow SOLID, AI tends to amplify the existing problems.

It may even generate the requested feature, but it will usually follow the patterns already present in the project.

If the foundation is poor, the result tends to be even more code that's hard to maintain.

---
## A fictional example: the bakery system

Imagine a system for a chain of bakeries.
There's a class called:

```csharp
PedidoManager
```

It does everything:
- Calculates discounts    
- Saves orders    
- Sends emails    
- Updates inventory    
- Generates reports    
- Issues invoices
    
One day the team receives a simple request:
> "Add a new discount for VIP customers."

It seems like a 30-minute task.

But when changing the discount logic:
- The report stops calculating correctly.    
- Inventory stops updating.    
- Invoice issuing starts failing.
    
Why?
Because everything is coupled inside the same class.

Now imagine another scenario.

A developer needs to find the email-sending feature.
Naturally, they search for:
```text
Email
Notification
Mailer
```

After an hour of searching, they discover the implementation is inside:

```text
Financeiro/PedidoManager.cs
```

Mixed together with tax calculation.

This is exactly the kind of problem SOLID helps avoid.

---

# The 5 principles in one line

## S — Single Responsibility Principle

One class, one responsibility.

If there are two reasons to change a class, it should probably be split.

---

## O — Open Closed Principle

Extend without modifying.

New behavior should be added through new implementations, not by altering code that already works.

---

## L — Liskov Substitution Principle

A subclass should be able to replace its parent class without breaking the system.

If the implementation completely changes the expected behavior, the inheritance is wrong.

---

## I — Interface Segregation Principle

Small, specific interfaces.

No one should be forced to implement methods they don't use.

---

## D — Dependency Inversion Principle

Depend on abstractions.

The business rule shouldn't know whether the data lives in SQL Server, PostgreSQL, or MongoDB.

---

# Simple examples to remember

| Principle | Example                                                                             |
| --------- | ----------------------------------------------------------------------------------- |
| S         | One robot serves drinks. Another cleans tables.                                     |
| O         | New type of drink? Create a new robot without changing the existing ones.           |
| L         | Any waiter robot should be able to serve a drink without unexpected behavior.        |
| I         | The cleaning robot doesn't need to implement "ServeDrink()".                         |
| D         | The waiter doesn't know where the drink is stored, it just asks someone to provide it. |

---

# S — Single Responsibility Principle

## ❌ Bad

```csharp
public class UsuarioService
{
    public void SalvarUsuario()
    {
        // saves the user
    }

    public void EnviarEmailBoasVindas()
    {
        // sends the email
    }
}
```

The class has two reasons to change:
- Changes to registration    
- Changes to email
    

---

## ✅ Good

```csharp
public class UsuarioService
{
    public void SalvarUsuario()
    {
        // saves the user
    }
}

public class EmailService
{
    public void EnviarBoasVindas()
    {
        // sends the email
    }
}
```

Each class has only one responsibility.

---

# O — Open Closed Principle

## ❌ Bad

```csharp
public decimal CalcularDesconto(string tipoCliente)
{
    if (tipoCliente == "Normal")
        return 0;

    if (tipoCliente == "VIP")
        return 10;

    if (tipoCliente == "Premium")
        return 20;

    return 0;
}
```

Every time a new customer type appears, the function needs to be changed.

---

## ✅ Good

```csharp
public interface IDesconto
{
    decimal Calcular();
}

public class DescontoVip : IDesconto
{
    public decimal Calcular() => 10;
}

public class DescontoPremium : IDesconto
{
    public decimal Calcular() => 20;
}
```

New discount?
New class.
No changes to existing code.

---

# L — Liskov Substitution Principle

## ❌ Bad

```csharp
public class Passaro
{
    public virtual void Voar()
    {
    }
}

public class Pinguim : Passaro
{
    public override void Voar()
    {
        throw new Exception("Pinguim não voa");
    }
}
```

Whoever uses `Passaro` (Bird) expects it to fly.
But the penguin breaks that expectation.

---

## ✅ Good

```csharp
public abstract class Passaro
{
}

public interface IVoa
{
    void Voar();
}

public class Aguia : Passaro, IVoa
{
    public void Voar()
    {
    }
}

public class Pinguim : Passaro
{
}
```

Now each type only has valid behaviors.

---

# I — Interface Segregation Principle

## ❌ Bad

```csharp
public interface IFuncionario
{
    void Trabalhar();
    void GerenciarEquipe();
}
```

An intern doesn't manage a team.
Even so, they're forced to implement it.

---

## ✅ Good

```csharp
public interface ITrabalhador
{
    void Trabalhar();
}

public interface IGerente
{
    void GerenciarEquipe();
}
```

Each class implements only what it actually uses.

---

# D — Dependency Inversion Principle

## ❌ Bad

```csharp
public class PedidoService
{
    private readonly SqlServerRepository _repository =
        new SqlServerRepository();

    public void Salvar()
    {
        _repository.Salvar();
    }
}
```

The business rule is locked to SQL Server.

---

## ✅ Good

```csharp
public interface IRepository
{
    void Salvar();
}

public class SqlServerRepository : IRepository
{
    public void Salvar()
    {
    }
}

public class PedidoService
{
    private readonly IRepository _repository;

    public PedidoService(IRepository repository)
    {
        _repository = repository;
    }

    public void Salvar()
    {
        _repository.Salvar();
    }
}
```

Now it's possible to swap the database without changing the business rule.

---

# The less-talked-about benefit: AI understands SOLID projects better

When a project follows SOLID:
- Responsibilities are clear.
- Files have well-defined purposes.    
- Extension points are predictable.    
- Tests are more isolated.    
- Dependencies are explicit.    

This doesn't only help developers.

It also helps AI tools.

An AI agent can more easily locate where a change should be made when the architecture is organized.

In chaotic projects, AI frequently replicates existing problems, increases coupling, and creates more technical debt.

---

# Conclusion

SOLID was never meant to make code more elegant.
Its goal was always to make changes safer.

And that has become even more important in an era where generating code costs mere seconds.

Development speed has increased.
But complexity is still there.

So, more than ever:

> AI-generated code without SOLID is just a faster way to create problems.

Code structured with SOLID, on the other hand, is easier to understand, test, review, evolve, and trust.

And that applies just as much to humans as it does to the AIs that will implement the next feature.

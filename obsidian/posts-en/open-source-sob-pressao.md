---
title: "Open Source Under Pressure: The Explosion of AI-Generated PRs and Its Impact on Security"
category: segurança
excerpt: Tools like Copilot, Claude Code, Codex, Cursor and others have drastically reduced the cost of producing code. The problem is that the cost of generating code has dropped, but the cost of reviewing code is still human.
slug: open-source-under-pressure
published_at: 2026-06-17
tags:
  - artificial-intelligence
  - security
  - open-source
seo_title: "Open Source Under Pressure: The Explosion of AI-Generated PRs and Its Impact on Security"
seo_description: Tools like Copilot, Claude Code, Codex, Cursor and others have drastically reduced the cost of producing code. The problem is that the cost of generating code has dropped, but the cost of reviewing code is still human.
seo_keywords:
  - artificial-intelligence
  - security
  - open-source
---
## Open Source is one of the foundations of modern software

Most of the commercial software used today depends on Open Source components.

Whether it's a startup, an e-commerce platform, a bank, or a large tech company, it's common for a single application to use dozens or even hundreds of third-party libraries.

Frameworks, authentication libraries, HTTP clients, ORMs, observability tools, UI components, and messaging systems are just a few examples of widely used dependencies.

In many projects, these dependencies are automatically updated by tools like Dependabot, Renovate, and CI/CD pipelines. This means that a change approved in an Open Source project can, directly or indirectly, reach thousands of production systems around the world.

For this reason, the health and security of the Open Source ecosystem isn't just a problem for maintainers. It impacts the entire software industry.

---

## The explosion of Pull Requests driven by AI

Tools like GitHub Copilot, Claude Code, Codex, Cursor, and others have drastically reduced the cost of producing code.

Today it's possible to generate a fix, a refactor, or even an entire feature in just a few minutes.

The result is predictable:

- More Pull Requests.
- More Issues.
- More improvement proposals.
- More automated reports.
- More AI-generated comments.

The problem is that the cost of generating code has dropped drastically, while the cost of reviewing code remains essentially human.

The bottleneck has shifted.

The challenge used to be writing software.

Now the challenge is validating whether the generated software deserves trust.

---

## The problem of contributions without context

A pattern observed by several maintainers is the increase in contributions that seem correct at first glance, but don't show real understanding of the project.

These Pull Requests frequently:

- Fix symptoms rather than root causes.
- Ignore existing architectural decisions.
- Don't follow internal standards.
- Don't consider backward compatibility.
- Don't understand business rules.
- Lack adequate tests.

The code compiles.

The tests pass.

But that doesn't mean the change is correct.

---

## The rise of duplicate requests

Another side effect is duplicated work.

When an issue is identified, multiple developers may use AI to generate similar solutions and submit multiple Pull Requests for the same problem.

This results in:

- Nearly identical PRs.
- Repeated fixes.
- Equivalent refactors.
- Duplicate discussions.

The outcome is that maintainers spend more time triaging contributions than actually evolving the project.

---

## The impact on maintainers

There's a mistaken perception that widely used Open Source projects have large dedicated teams.

In practice, many of them rely on:

- Small groups of developers.
- Volunteer work.
- After-hours availability.
- Limited funding.

While the number of contributions grows, the number of specialized reviewers stays roughly the same.

This imbalance creates a problem well known to any engineering team:

**review fatigue.**

The larger the volume of changes, the harder it becomes to analyze each contribution with the necessary depth.

---

## When productivity turns into a security risk

Software security depends heavily on the quality of code review.

An overloaded team tends to:

- Review more quickly.
- Rely excessively on automated tests.
- Analyze fewer details.
- Prioritize quantity over depth.

It's precisely in this scenario that vulnerabilities can go unnoticed.

Some examples include:

- Authentication flaws.
- Authorization flaws.
- SQL Injection.
- Cross-Site Scripting (XSS).
- Leakage of sensitive information.
- Insecure dependencies.
- Introduction of unexpected behavior.

The problem isn't necessarily AI generating insecure code.

The problem is the combination of:
> More code being produced + the same human review capacity.

---

## A small project can impact thousands of companies

The modern dependency chain is extremely interconnected.
A single library can be used by:
- Frameworks.
- SaaS platforms.
- Enterprise applications.
- Mobile apps.
- Financial systems.
- Critical infrastructure.

When a vulnerability is introduced into a widely used dependency, the impact can spread rapidly across the entire software chain.

This is precisely why Supply Chain Attacks have become one of the industry's biggest concerns in recent years.

---

## The future of software security

The trend is that code generation will keep getting cheaper.
At the same time, validation will continue to require specialized human knowledge.

For this reason, in the coming years the industry will likely need to invest more in:
- Specialized code review.
- Security audits.
- Static analysis tools.
- More robust automated testing.
- Dependency verification.
- Specific policies for AI-assisted contributions.

The productivity provided by AI is real.
But trust cannot be generated automatically.

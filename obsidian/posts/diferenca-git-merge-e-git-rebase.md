---
title: Diferenças entre o Git Merge e o Git Rebase
category: git
excerpt: Entender a diferença entre eles é fundamental para evitar conflitos desnecessários, perda de produtividade e até problemas no histórico do projeto.
slug: exemplo-post-obsidian
published_at: 2026-06-22
tags:
  - git-estrategias
  - código
  - consistência
seo_title: Diferença entre Git Merge e Git Rebase
seo_description: Entender a diferença entre eles é fundamental para evitar conflitos desnecessários, perda de produtividade e até problemas no histórico do projeto.
seo_keywords:
  - git-estrategias
  - código
  - consistência
---
# Git Merge vs Git Rebase: Qual a Diferença e Quando Utilizar?

Uma das dúvidas mais comuns entre desenvolvedores que começam a trabalhar com Git em equipes é:

> Devo usar Merge ou Rebase?

A resposta é: ambos possuem seu lugar.

Entender a diferença entre eles é fundamental para evitar conflitos desnecessários, perda de produtividade e até problemas no histórico do projeto.

---
## Git Merge

O Merge une duas linhas de desenvolvimento preservando o histórico original de ambas.
Recomendado quando:
- A branch é compartilhada com outras pessoas.    
- Você quer manter o histórico real do projeto.    
- O time prioriza segurança sobre um histórico perfeitamente linear.

Comando:
```bash
git merge feature
```

---
## Git Rebase

O Rebase reaplica os commits da sua branch sobre uma nova base.
Recomendado quando:
- Você está trabalhando sozinho na branch.
- Quer um histórico mais limpo e linear.    
- Vai abrir um Pull Request.
    
Comando:

```bash
git rebase main
```

---

## Regra prática

Se a branch é somente sua:

```bash
git rebase main
```

Se outras pessoas também utilizam a branch:

```bash
git merge main
```

Evite fazer rebase em branches compartilhadas.

---

# Entendendo o Git Merge

Imagine o seguinte cenário:

```text
main
A --- B --- C

feature
       \
        D --- E
```

A branch `feature` foi criada a partir do commit B.

Durante o desenvolvimento, novos commits foram adicionados em ambas as branches.

Ao executar:

```bash
git checkout main
git merge feature
```

O Git cria um commit especial de merge:

```text
A --- B --- C -------- M
       \             /
        D --- E -----
```

O commit `M` conecta os dois históricos.

---

## Vantagens do Merge

- Não altera o histórico existente.    
- Mais seguro para equipes.    
- Fácil de entender.    
- Evita reescrita de commits.
    
---

## Desvantagens do Merge

Em projetos grandes pode gerar históricos parecidos com:
```text
Merge branch feature-login
Merge branch feature-payment
Merge branch feature-report
Merge branch hotfix
```

O histórico fica mais poluído.

---

# Entendendo o Git Rebase

Mesma situação inicial:

```text
main
A --- B --- C

feature
       \
        D --- E
```

Executando:

```bash
git checkout feature
git rebase main
```

O Git faz algo diferente.
Ele pega os commits D e E e os recria sobre o commit C.

Resultado:

```text
main
A --- B --- C

feature
               \
                D' --- E'
```

Observe que:
- D virou D'
- E virou E'
    
São novos commits.
Depois disso:

```bash
git checkout main
git merge feature
```

Resultado:

```text
A --- B --- C --- D' --- E'
```

Sem commit de merge.
Histórico totalmente linear.

---

## Vantagens do Rebase

- Histórico mais limpo.    
- Facilita análise do projeto.    
- Excelente para Pull Requests.
    
---

## Desvantagens do Rebase

- Reescreve histórico.    
- Pode gerar confusão em equipes.    
- Pode exigir force push.
    

---

# Merge vs Rebase na Prática

| Cenário                      | Recomendação |
| ---------------------------- | ------------ |
| Branch pessoal               | Rebase       |
| Pull Request antes de enviar | Rebase       |
| Branch compartilhada         | Merge        |
| Equipe grande                | Merge        |
| Histórico linear             | Rebase       |
| Máxima segurança             | Merge        |

---

# O Maior Erro com Rebase

Imagine:

```bash
git push origin feature
```

Outros desenvolvedores baixam sua branch.

Depois você executa:

```bash
git rebase main
git push --force
```

Agora o histórico mudou.
Quem já possuía a branch localmente verá:
- Commits duplicados    
- Conflitos inesperados    
- Histórico aparentemente quebrado
    
Por isso existe uma regra amplamente utilizada:

> Nunca faça rebase em commits que já foram compartilhados com outras pessoas.

---

# Conclusão

Merge e Rebase não competem entre si.
Eles resolvem problemas diferentes.
- Merge prioriza segurança e preservação do histórico.    
- Rebase prioriza limpeza e linearidade do histórico.
    
Uma estratégia bastante utilizada em equipes modernas é:
1. Desenvolver na feature branch.    
2. Fazer Rebase com a main antes do Pull Request.    
3. Após aprovação, realizar Merge na main.
    
Dessa forma é possível obter um histórico limpo sem abrir mão da segurança durante o desenvolvimento colaborativo.
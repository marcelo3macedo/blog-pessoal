---
title: "Análise de Uso de Memória no Node.js"
category: arquitetura
excerpt: "Uma das grandes vantagens do Node.js é sua capacidade de lidar com milhares de conexões simultâneas utilizando um modelo baseado em eventos e operações assíncronas."
slug: analise-uso-memoria-node-js
published_at: 2026-06-25
tags:
  - memoria
  - aprimoramento
seo_title: "Análise de Uso de Memória no Node.js"
seo_description: "Uma das grandes vantagens do Node.js é sua capacidade de lidar com milhares de conexões simultâneas utilizando um modelo baseado em eventos e operações assíncronas."
seo_keywords:
  - memoria
  - aprimoramento
---

# Análise de Uso de Memória no Node.js

Uma das grandes vantagens do Node.js é sua capacidade de lidar com milhares de conexões simultâneas utilizando um modelo baseado em eventos e operações assíncronas.

Porém, essa facilidade também pode esconder problemas de consumo excessivo de memória quando a aplicação cresce.

É comum encontrar aplicações que funcionam perfeitamente durante os testes iniciais, mas começam a apresentar lentidão, pausas frequentes do Garbage Collector ou até mesmo falhas por falta de memória quando passam a processar grandes volumes de dados.

Muitas dessas situações não estão relacionadas à quantidade de requisições recebidas, mas sim à forma como os dados são carregados e mantidos em memória.

Este projeto demonstra dois cenários extremamente comuns em aplicações Node.js:

* Leitura de arquivos grandes
* Processamento de grandes volumes de dados provenientes de banco de dados

Além disso, apresenta abordagens mais eficientes utilizando Streams, cursores e processamento em lotes.

---

# Como o Node.js Utiliza Memória

Antes de analisar os cenários, é importante entender alguns conceitos.

O Node.js utiliza o mecanismo V8, responsável por gerenciar a memória da aplicação.

Entre os principais indicadores estão:

### Heap

Local onde objetos JavaScript são armazenados.

Exemplo:

```javascript
const users = [];
```

Todos os objetos adicionados ao array ocupam espaço na Heap.

---

### RSS (Resident Set Size)

Representa toda a memória ocupada pelo processo.

Inclui:

* Heap
* Buffers
* Código carregado
* Bibliotecas nativas
* Estruturas internas do Node.js

Por isso normalmente o RSS é maior que a Heap.

---

# Objetivo do Projeto

O projeto foi criado para responder uma pergunta muito comum:

> Como processar grandes volumes de dados sem consumir centenas de megabytes de memória?

Para isso foram simulados dois cenários reais encontrados frequentemente em sistemas corporativos.

---

# Cenário 1 — Processamento de Arquivos CSV

Imagine um sistema que precisa importar arquivos CSV enviados pelos usuários.

Exemplo:

```csv
id,nome,email
1,João,joao@email.com
2,Maria,maria@email.com
...
100000 registros
```

Uma implementação ingênua pode funcionar perfeitamente em pequenos arquivos, mas se tornar um problema conforme os dados aumentam.

---

# Implementação Antes da Otimização

A abordagem mais comum costuma ser:

```javascript
const content = fs.readFileSync('users.csv', 'utf8');
const lines = content.split('\n');
```

O que acontece internamente?

```text
Arquivo
    ↓
Buffer completo
    ↓
String completa
    ↓
Array de linhas
    ↓
Objetos JavaScript
```

Durante esse processo existem múltiplas cópias dos dados em memória simultaneamente.

Quanto maior o arquivo, maior o impacto.

---

# Resultado Obtido

| Métrica   | Antes     |
| --------- | --------- |
| Pico Heap | 69.48 MB  |
| Pico RSS  | 139.63 MB |

---

# Utilizando Streams

Uma alternativa muito mais eficiente é utilizar Streams.

Exemplo:

```javascript
const stream = fs.createReadStream('users.csv');
```

Combinado com:

```javascript
readline.createInterface(...)
```

o processamento ocorre linha por linha.

---

# Fluxo Utilizando Stream

```text
Arquivo
    ↓
Linha 1
Processa
Descarta

Linha 2
Processa
Descarta

Linha 3
Processa
Descarta
```

A quantidade de memória utilizada deixa de depender do tamanho total do arquivo.

---

# Resultado Após Otimização

| Métrica   | Depois   |
| --------- | -------- |
| Pico Heap | 7.75 MB  |
| Pico RSS  | 63.08 MB |

---

# Economia Obtida

| Métrica | Economia |
| ------- | -------- |
| Heap    | 88.8%    |
| RSS     | 54.8%    |

---

# Por Que Streams Funcionam Melhor?

A principal vantagem é que apenas uma pequena parte do arquivo permanece em memória por vez.

Mesmo que o arquivo cresça para:

```text
10 GB
50 GB
100 GB
```

o consumo de memória continua praticamente constante.

---

# Cenário 2 — Consultas ao Banco de Dados

Outro problema muito comum ocorre durante consultas massivas.

Imagine uma tabela contendo:

```text
100.000 registros
```

ou até:

```text
1.000.000 registros
```

---

# Implementação Antes da Otimização

Muitos desenvolvedores utilizam algo semelhante a:

```javascript
const users = await repository.findAll();
```

ou

```javascript
SELECT * FROM users;
```

O banco retorna todos os registros de uma única vez.

---

# O Problema

O fluxo normalmente é:

```text
Banco
    ↓
100.000 linhas
    ↓
Objetos JS
    ↓
Heap
```

Todo o conjunto precisa permanecer em memória simultaneamente.

---

# Resultado Obtido

| Métrica   | Antes     |
| --------- | --------- |
| Pico Heap | 63.50 MB  |
| Pico RSS  | 129.25 MB |

---

# Utilizando Cursores e Processamento em Lotes

Uma abordagem mais eficiente consiste em processar pequenos grupos de registros.

Exemplo:

```javascript
for await (const batch of cursor) {
   process(batch);
}
```

ou utilizando AsyncGenerator:

```javascript
async function* getUsers() {
   ...
}
```

---

# Fluxo Utilizando Cursor

```text
Banco
    ↓
1000 registros
Processa
Descarta

1000 registros
Processa
Descarta

1000 registros
Processa
Descarta
```

O Garbage Collector pode liberar memória continuamente.

---

# Resultado Após Otimização

| Métrica   | Depois   |
| --------- | -------- |
| Pico Heap | 10.65 MB |
| Pico RSS  | 63.75 MB |

---

# Economia Obtida

| Métrica | Economia |
| ------- | -------- |
| Heap    | 83.2%    |
| RSS     | 50.7%    |

---

# O Impacto no Garbage Collector

Quando grandes estruturas permanecem em memória:

```text
Array gigantesco
Objetos gigantescos
Strings gigantescas
```

o Garbage Collector precisa trabalhar mais.

Isso provoca:

* Mais pausas
* Maior uso de CPU
* Menor throughput
* Aumento de latência

Em aplicações web isso pode impactar diretamente o tempo de resposta para o usuário.

---

# Quando Utilizar Streams

Streams são recomendados para:

* Arquivos CSV
* Logs
* Arquivos TXT
* Uploads
* Downloads
* Exportações
* Integrações com APIs

Sempre que possível, evite carregar arquivos inteiros na memória.

---

# Quando Utilizar Cursores

Cursores são recomendados para:

* Relatórios
* Migrações de dados
* Processamentos em massa
* Exportações
* Integrações entre sistemas

Sempre que o volume de dados puder crescer significativamente.

---

# Sinais de Problemas de Memória

Alguns sintomas comuns:

### Crescimento constante da memória

```text
200 MB
300 MB
500 MB
800 MB
```

sem retornar ao valor inicial.

---

### Garbage Collector frequente

Logs contendo:

```text
Mark-Sweep
Scavenge
Allocation Failure
```

com alta frequência.

---

### Processo sendo encerrado

Erro clássico:

```text
FATAL ERROR:
JavaScript heap out of memory
```

---

### Lentidão inesperada

Mesmo sem aumento de CPU ou banco de dados.

Muitas vezes o problema está no gerenciamento da memória.

---

# Boas Práticas para Aplicações Node.js

Evite:

```javascript
findAll()
```

em tabelas muito grandes.

---

Prefira:

```javascript
Paginação
Cursores
Streams
```

---

Evite:

```javascript
fs.readFileSync()
```

para arquivos grandes.

---

Prefira:

```javascript
createReadStream()
```

---

Monitore constantemente:

```javascript
process.memoryUsage()
```

para identificar comportamentos anormais.

---

# Resultados Consolidados

| Cenário        | Economia Heap | Economia RSS |
| -------------- | ------------- | ------------ |
| Arquivos CSV   | 88.8%         | 54.8%        |
| Banco de Dados | 83.2%         | 50.7%        |

Os números demonstram que pequenas mudanças arquiteturais podem reduzir drasticamente o consumo de memória sem necessidade de aumentar recursos da infraestrutura.

---

# Conclusão

O consumo excessivo de memória em aplicações Node.js raramente está relacionado apenas ao volume de usuários.

Na maioria dos casos, o problema está na forma como os dados são carregados e processados.

A utilização de Streams para arquivos e Cursores para consultas de banco permite trabalhar com grandes volumes de dados mantendo um consumo previsível e controlado de memória.

Os resultados obtidos neste projeto mostram reduções superiores a 80% no uso da Heap, evidenciando como decisões arquiteturais simples podem aumentar significativamente a escalabilidade e estabilidade de aplicações Node.js.

Mais do que otimizar memória, essas técnicas ajudam a construir sistemas capazes de crescer sem exigir constantemente mais CPU, mais RAM ou servidores maiores.

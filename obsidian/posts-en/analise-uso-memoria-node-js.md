---
title: "Memory Usage Analysis in Node.js"
category: arquitetura
excerpt: "One of the great advantages of Node.js is its ability to handle thousands of simultaneous connections using an event-based model and asynchronous operations."
slug: memory-usage-analysis-in-node-js
published_at: 2026-06-25
tags:
  - memory
  - optimization
seo_title: "Memory Usage Analysis in Node.js"
seo_description: "One of the great advantages of Node.js is its ability to handle thousands of simultaneous connections using an event-based model and asynchronous operations."
seo_keywords:
  - memory
  - optimization
---

# Memory Usage Analysis in Node.js

One of the great advantages of Node.js is its ability to handle thousands of simultaneous connections using an event-based model and asynchronous operations.

However, this same ease of use can also hide problems of excessive memory consumption as an application grows.

It's common to find applications that work perfectly during initial testing, but start showing slowdowns, frequent Garbage Collector pauses, or even out-of-memory crashes once they begin processing large volumes of data.

Many of these situations aren't related to the number of requests received, but rather to how the data is loaded and kept in memory.

This project demonstrates two extremely common scenarios in Node.js applications:

* Reading large files
* Processing large volumes of data coming from a database

It also presents more efficient approaches using Streams, cursors, and batch processing.

---

# How Node.js Uses Memory

Before analyzing the scenarios, it's important to understand a few concepts.

Node.js uses the V8 engine, which is responsible for managing the application's memory.

Among the main indicators are:

### Heap

Where JavaScript objects are stored.

Example:

```javascript
const users = [];
```

All objects added to the array take up space in the Heap.

---

### RSS (Resident Set Size)

Represents all the memory occupied by the process.

It includes:

* Heap
* Buffers
* Loaded code
* Native libraries
* Node.js internal structures

That's why RSS is usually larger than the Heap.

---

# Project Goal

This project was created to answer a very common question:

> How can you process large volumes of data without consuming hundreds of megabytes of memory?

To do this, two real-world scenarios frequently found in enterprise systems were simulated.

---

# Scenario 1 — CSV File Processing

Imagine a system that needs to import CSV files uploaded by users.

Example:

```csv
id,name,email
1,John,john@email.com
2,Mary,mary@email.com
...
100,000 records
```

A naive implementation may work perfectly with small files, but becomes a problem as the data grows.

---

# Implementation Before Optimization

The most common approach tends to be:

```javascript
const content = fs.readFileSync('users.csv', 'utf8');
const lines = content.split('\n');
```

What happens internally?

```text
File
    ↓
Full buffer
    ↓
Full string
    ↓
Array of lines
    ↓
JavaScript objects
```

During this process there are multiple copies of the data in memory at the same time.

The larger the file, the greater the impact.

---

# Result Obtained

| Metric    | Before    |
| --------- | --------- |
| Peak Heap | 69.48 MB  |
| Peak RSS  | 139.63 MB |

---

# Using Streams

A much more efficient alternative is to use Streams.

Example:

```javascript
const stream = fs.createReadStream('users.csv');
```

Combined with:

```javascript
readline.createInterface(...)
```

processing happens line by line.

---

# Flow Using Stream

```text
File
    ↓
Line 1
Process
Discard

Line 2
Process
Discard

Line 3
Process
Discard
```

The amount of memory used stops depending on the total size of the file.

---

# Result After Optimization

| Metric    | After    |
| --------- | -------- |
| Peak Heap | 7.75 MB  |
| Peak RSS  | 63.08 MB |

---

# Savings Achieved

| Metric | Savings |
| ------ | ------- |
| Heap   | 88.8%   |
| RSS    | 54.8%   |

---

# Why Do Streams Work Better?

The main advantage is that only a small part of the file stays in memory at a time.

Even if the file grows to:

```text
10 GB
50 GB
100 GB
```

memory consumption remains practically constant.

---

# Scenario 2 — Database Queries

Another very common problem occurs during massive queries.

Imagine a table containing:

```text
100,000 records
```

or even:

```text
1,000,000 records
```

---

# Implementation Before Optimization

Many developers use something similar to:

```javascript
const users = await repository.findAll();
```

or

```javascript
SELECT * FROM users;
```

The database returns all the records at once.

---

# The Problem

The flow is typically:

```text
Database
    ↓
100,000 rows
    ↓
JS objects
    ↓
Heap
```

The entire set needs to stay in memory at the same time.

---

# Result Obtained

| Metric    | Before    |
| --------- | --------- |
| Peak Heap | 63.50 MB  |
| Peak RSS  | 129.25 MB |

---

# Using Cursors and Batch Processing

A more efficient approach consists of processing small groups of records.

Example:

```javascript
for await (const batch of cursor) {
   process(batch);
}
```

or using an AsyncGenerator:

```javascript
async function* getUsers() {
   ...
}
```

---

# Flow Using Cursor

```text
Database
    ↓
1000 records
Process
Discard

1000 records
Process
Discard

1000 records
Process
Discard
```

The Garbage Collector can continuously free up memory.

---

# Result After Optimization

| Metric    | After    |
| --------- | -------- |
| Peak Heap | 10.65 MB |
| Peak RSS  | 63.75 MB |

---

# Savings Achieved

| Metric | Savings |
| ------ | ------- |
| Heap   | 83.2%   |
| RSS    | 50.7%   |

---

# The Impact on the Garbage Collector

When large structures remain in memory:

```text
Giant array
Giant objects
Giant strings
```

the Garbage Collector has to work harder.

This causes:

* More pauses
* Higher CPU usage
* Lower throughput
* Increased latency

In web applications, this can directly impact response time for the user.

---

# When to Use Streams

Streams are recommended for:

* CSV files
* Logs
* TXT files
* Uploads
* Downloads
* Exports
* API integrations

Whenever possible, avoid loading entire files into memory.

---

# When to Use Cursors

Cursors are recommended for:

* Reports
* Data migrations
* Bulk processing
* Exports
* Integrations between systems

Whenever the data volume can grow significantly.

---

# Signs of Memory Problems

Some common symptoms:

### Constant memory growth

```text
200 MB
300 MB
500 MB
800 MB
```

without ever returning to the initial value.

---

### Frequent Garbage Collector activity

Logs containing:

```text
Mark-Sweep
Scavenge
Allocation Failure
```

occurring at a high frequency.

---

### Process being terminated

Classic error:

```text
FATAL ERROR:
JavaScript heap out of memory
```

---

### Unexpected slowness

Even without an increase in CPU or database load.

The problem often lies in memory management.

---

# Best Practices for Node.js Applications

Avoid:

```javascript
findAll()
```

on very large tables.

---

Prefer:

```javascript
Pagination
Cursors
Streams
```

---

Avoid:

```javascript
fs.readFileSync()
```

for large files.

---

Prefer:

```javascript
createReadStream()
```

---

Constantly monitor:

```javascript
process.memoryUsage()
```

to identify abnormal behavior.

---

# Consolidated Results

| Scenario  | Heap Savings | RSS Savings |
| --------- | ------------ | ----------- |
| CSV Files | 88.8%        | 54.8%       |
| Database  | 83.2%        | 50.7%       |

These numbers show that small architectural changes can drastically reduce memory consumption without needing to increase infrastructure resources.

---

# Conclusion

Excessive memory consumption in Node.js applications is rarely related only to the number of users.

In most cases, the problem lies in how the data is loaded and processed.

Using Streams for files and Cursors for database queries makes it possible to work with large volumes of data while maintaining predictable and controlled memory consumption.

The results obtained in this project show reductions of over 80% in Heap usage, showing how simple architectural decisions can significantly increase the scalability and stability of Node.js applications.

More than just optimizing memory, these techniques help build systems capable of growing without constantly requiring more CPU, more RAM, or larger servers.

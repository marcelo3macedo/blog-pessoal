"use client";
import { useState, useEffect, useRef } from "react";

/* ─── Types ────────────────────────────────────────────────────────────── */

type ScenarioId =
  | "basic_queue" | "more_tellers" | "manager_dep" | "async_chairs"
  | "auto_scaling" | "retry_backoff" | "overflow" | "prefetch";

interface TellerState {
  id: number;
  status: "idle" | "busy" | "waiting_manager" | "overloaded";
  clientId?: number;
}

interface ChairState {
  id: number;
  occupied: boolean;
  clientId?: number;
}

interface Step {
  description: string;
  code?: string;
  outcome?: string;
  isWarning?: boolean;
  tellers: TellerState[];
  queue: number[];          // client ids
  chairs: ChairState[];
  managerStatus: "free" | "busy" | "unavailable";
  retryInfo?: { attempt: number; maxAttempts: number; waitLabel: string };
  heapPercent?: number;     // 0-100 for overflow scenario
  cpuPercent?: number;
  podCount?: number;        // auto-scaling
  metrics: { label: string; value: string; warn?: boolean; ok?: boolean }[];
}

interface ScenarioDef {
  title: string;
  subtitle: string;
  color: string;
  emoji: string;
  steps: Step[];
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function mkTellers(count: number, overrides: Partial<TellerState>[] = []): TellerState[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    status: "idle" as const,
    ...overrides[i],
  }));
}

function mkChairs(max: number, occupied: { id: number; clientId: number }[] = []): ChairState[] {
  return Array.from({ length: max }, (_, i) => {
    const occ = occupied.find(o => o.id === i);
    return { id: i, occupied: !!occ, clientId: occ?.clientId };
  });
}

/* ─── Scenario data ─────────────────────────────────────────────────────── */

const SCENARIOS: Record<ScenarioId, ScenarioDef> = {

  /* ── 1. Fila Simples ─────────────────────────────────── */
  basic_queue: {
    title: "Fila Simples", subtitle: "6 atendentes síncronos — event loop bloqueante",
    color: "#3B82F6", emoji: "🏦",
    steps: [
      {
        description: "Banco abre. 6 guichês disponíveis, fila vazia.",
        tellers: mkTellers(6),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Guichês livres", value: "6 / 6", ok: true }, { label: "Fila", value: "vazia", ok: true }],
      },
      {
        description: "Cliente 1 chega e é atendido imediatamente no guichê 1.",
        tellers: mkTellers(6, [{ id: 0, status: "busy", clientId: 1 }]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Guichê 1", value: "atendendo", ok: true }, { label: "Espera", value: "0 min", ok: true }],
      },
      {
        description: "Cliente 2 chega — guichê 2 o atende na hora.",
        tellers: mkTellers(6, [{ id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 }]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Guichês ativos", value: "2 / 6" }, { label: "Espera média", value: "2 min", ok: true }],
      },
      {
        description: "Clientes 3, 4 e 5 chegam — guichês 3, 4 e 5 os absorvem.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 }, { id: 3, status: "busy", clientId: 4 },
          { id: 4, status: "busy", clientId: 5 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Guichês ativos", value: "5 / 6" }, { label: "Espera média", value: "3 min", ok: true }],
      },
      {
        description: "Cliente 6 chega — último guichê disponível. Banco 100% ocupado.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 }, { id: 3, status: "busy", clientId: 4 },
          { id: 4, status: "busy", clientId: 5 }, { id: 5, status: "busy", clientId: 6 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Guichês ativos", value: "6 / 6", warn: true }, { label: "Fila", value: "vazia (ainda)", ok: true }],
      },
      {
        description: "12h — pico. Cliente 7 chega, não há guichê livre. Entra na fila.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 }, { id: 3, status: "busy", clientId: 4 },
          { id: 4, status: "busy", clientId: 5 }, { id: 5, status: "busy", clientId: 6 },
        ]),
        queue: [7], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Fila", value: "1 cliente", warn: true }, { label: "Espera estimada", value: "~8 min", warn: true }],
      },
      {
        description: "Clientes 8 e 9 chegam — fila cresce.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy" }, { id: 1, status: "busy" }, { id: 2, status: "busy" },
          { id: 3, status: "busy" }, { id: 4, status: "busy" }, { id: 5, status: "busy" },
        ]),
        queue: [7, 8, 9], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Fila", value: "3 clientes", warn: true }, { label: "Espera estimada", value: "~15 min", warn: true }],
      },
      {
        description: "Clientes 10, 11 e 12 chegam. Fila não para de crescer.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy" }, { id: 1, status: "busy" }, { id: 2, status: "busy" },
          { id: 3, status: "busy" }, { id: 4, status: "busy" }, { id: 5, status: "busy" },
        ]),
        queue: [7, 8, 9, 10, 11, 12], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Fila", value: "6 clientes", warn: true }, { label: "Espera estimada", value: "~25 min", warn: true }],
      },
      {
        description: "Clientes 13 e 14 chegam. Insatisfação crescente — alguns desistem e vão embora.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy" }, { id: 1, status: "busy" }, { id: 2, status: "busy" },
          { id: 3, status: "busy" }, { id: 4, status: "busy" }, { id: 5, status: "busy" },
        ]),
        queue: [7, 8, 9, 10, 11, 12, 13, 14], chairs: mkChairs(0), managerStatus: "free",
        outcome: "❌ Node.js single-thread: processamento síncrono bloqueia o event loop. Novas requisições aguardam na fila do SO.",
        isWarning: true,
        code: `// ❌ Síncrono — bloqueia o event loop
app.get('/saldo', (req, res) => {
  const result = calcularSaldo(req.params.id);
  // CPU presa aqui → nenhuma outra req processa
  res.json(result);
});`,
        metrics: [
          { label: "Fila", value: "8 clientes", warn: true },
          { label: "Espera média", value: "35 min 😤", warn: true },
          { label: "Event loop", value: "BLOQUEADO ❌", warn: true },
        ],
      },
    ],
  },

  /* ── 2. Mais Atendentes ──────────────────────────────── */
  more_tellers: {
    title: "+Atendentes", subtitle: "Workers fixos — pico resolvido, vale desperdiçado",
    color: "#F59E0B", emoji: "👥",
    steps: [
      {
        description: "Gerente decide dobrar o efetivo para 12 atendentes fixos.",
        tellers: mkTellers(12),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Atendentes", value: "12 (fixo)" }, { label: "Custo/mês", value: "R$ 60k", warn: true }],
      },
      {
        description: "Manhã — clientes 1 e 2 chegam, guichês 1 e 2 os atendem.",
        tellers: mkTellers(12, [{ id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 }]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Ativos", value: "2 / 12" }, { label: "Ociosos", value: "10 / 12", warn: true }],
      },
      {
        description: "12h — cliente 3, 4, 5 chegam juntos. Guichês 3, 4, 5 os absorvem imediatamente.",
        tellers: mkTellers(12, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 }, { id: 3, status: "busy", clientId: 4 },
          { id: 4, status: "busy", clientId: 5 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Ativos", value: "5 / 12" }, { label: "Fila", value: "vazia ✓", ok: true }],
      },
      {
        description: "Pico total — 12 clientes chegam. Todos os guichês ocupados. Fila zerada.",
        tellers: mkTellers(12, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 }, { id: 3, status: "busy", clientId: 4 },
          { id: 4, status: "busy", clientId: 5 }, { id: 5, status: "busy", clientId: 6 },
          { id: 6, status: "busy", clientId: 7 }, { id: 7, status: "busy", clientId: 8 },
          { id: 8, status: "busy", clientId: 9 }, { id: 9, status: "busy", clientId: 10 },
          { id: 10, status: "busy", clientId: 11 }, { id: 11, status: "busy", clientId: 12 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Fila", value: "vazia ✓", ok: true }, { label: "Espera", value: "0 min ✓", ok: true }],
      },
      {
        description: "15h — movimento cai. Clientes terminam. Guichês ficam ociosos um a um.",
        tellers: mkTellers(12, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 }, { id: 3, status: "busy", clientId: 4 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Ativos", value: "4 / 12", warn: true }, { label: "Ociosos", value: "8 / 12", warn: true }],
      },
      {
        description: "Mais atendimentos terminam. Ficam só 2 clientes.",
        tellers: mkTellers(12, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Ativos", value: "2 / 12", warn: true }, { label: "Ociosos", value: "10 / 12", warn: true }],
      },
      {
        description: "17h — banco quase vazio. 12 atendentes parados, custo fixo correndo.",
        tellers: mkTellers(12),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        outcome: "💸 Workers fixos = custo fixo. 100% ocioso às 17h mas pagando como se fosse meio-dia.",
        isWarning: true,
        code: `// PM2 cluster com instâncias fixas
module.exports = {
  apps: [{
    name: 'api',
    instances: 12, // sempre 12 — mesmo às 3am
    exec_mode: 'cluster'
  }]
};`,
        metrics: [
          { label: "Ativos", value: "0 / 12", warn: true },
          { label: "Ociosidade", value: "100% 😬", warn: true },
          { label: "Custo", value: "R$ 60k/mês", warn: true },
        ],
      },
    ],
  },

  /* ── 3. Dependência do Gerente ───────────────────────── */
  manager_dep: {
    title: "Dependência Gerente", subtitle: "I/O bloqueante — thread presa",
    color: "#EF4444", emoji: "⏳",
    steps: [
      {
        description: "6 guichês. Pedidos simples (saldo, extrato) são processados rápido.",
        tellers: mkTellers(6, [{ id: 0, status: "busy", clientId: 1 }]),
        queue: [2, 3], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Tempo médio", value: "3 min", ok: true }, { label: "Throughput", value: "20/h", ok: true }],
      },
      {
        description: "Cliente 2 chega com pedido simples — guichê 2 atende em segundos.",
        tellers: mkTellers(6, [{ id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 }]),
        queue: [3], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Guichês ativos", value: "2 / 6" }, { label: "Fila", value: "1 cliente" }],
      },
      {
        description: "Cliente 3 chega com pedido complexo (análise de crédito). Guichê 3 começa a atendê-lo.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Guichê 3", value: "pedido complexo" }, { label: "Gerente", value: "livre" }],
      },
      {
        description: "Guichê 3 precisa do gerente. Vai ao escritório — gerente fica ocupado. Guichê 3 parado.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "waiting_manager", clientId: 3 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "busy",
        metrics: [{ label: "Guichê 3", value: "PARADO ⏳", warn: true }, { label: "Gerente", value: "ocupado", warn: true }],
      },
      {
        description: "Clientes 4 e 5 chegam. Guichês 4 e 5 atendem — mas guichê 3 ainda está bloqueado.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "waiting_manager", clientId: 3 },
          { id: 3, status: "busy", clientId: 4 }, { id: 4, status: "busy", clientId: 5 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "busy",
        metrics: [{ label: "Guichê 3 parado", value: "3 min ⏳", warn: true }],
      },
      {
        description: "5 min depois: guichê 3 continua esperando. Clientes novos começam a se acumular.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "waiting_manager", clientId: 3 },
          { id: 3, status: "busy", clientId: 4 }, { id: 4, status: "busy", clientId: 5 },
        ]),
        queue: [6, 7], chairs: mkChairs(0), managerStatus: "busy",
        metrics: [{ label: "Guichê 3 parado", value: "5 min ❌", warn: true }, { label: "Fila crescendo", value: "2", warn: true }],
      },
      {
        description: "8 min bloqueado. Fila cresce — o guichê trancado diminui capacidade efetiva.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "waiting_manager", clientId: 3 },
          { id: 3, status: "busy", clientId: 4 }, { id: 4, status: "busy", clientId: 5 },
        ]),
        queue: [6, 7, 8, 9], chairs: mkChairs(0), managerStatus: "busy",
        outcome: "❌ I/O síncrono: thread presa esperando banco/API responder. Capacidade real: 5 guichês, não 6.",
        isWarning: true,
        code: `// ❌ Thread presa — bloqueia até o I/O responder
app.get('/credito', (req, res) => {
  const r = http.get(creditServiceUrl); // bloqueia!
  res.json(r);
});`,
        metrics: [
          { label: "Guichê 3 parado", value: "8 min ❌", warn: true },
          { label: "Fila", value: "4 clientes", warn: true },
          { label: "Throughput", value: "↓ 40%", warn: true },
        ],
      },
    ],
  },

  /* ── 4. Async / Cadeiras ─────────────────────────────── */
  async_chairs: {
    title: "Async / Cadeiras", subtitle: "await libera o guichê — Promises ilimitadas esgotam heap",
    color: "#8B5CF6", emoji: "💺",
    steps: [
      {
        description: "Nova política: pedido complexo → cliente senta na área de espera. Guichê fica livre para o próximo.",
        tellers: mkTellers(6),
        queue: [1, 2, 3], chairs: mkChairs(4), managerStatus: "free",
        metrics: [{ label: "Cadeiras", value: "0 / 4", ok: true }, { label: "Guichês livres", value: "6 / 6", ok: true }],
      },
      {
        description: "Cliente 1 — pedido simples. Guichê 1 atende e finaliza rapidamente.",
        tellers: mkTellers(6, [{ id: 0, status: "busy", clientId: 1 }]),
        queue: [2, 3], chairs: mkChairs(4), managerStatus: "free",
        metrics: [{ label: "Cadeiras", value: "0 / 4", ok: true }, { label: "Guichê 1", value: "atendendo" }],
      },
      {
        description: "Cliente 2 — pedido complexo. Vai para cadeira 1. Guichê 2 imediatamente chama cliente 3.",
        tellers: mkTellers(6, [{ id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 3 }]),
        queue: [], chairs: mkChairs(4, [{ id: 0, clientId: 2 }]), managerStatus: "busy",
        metrics: [{ label: "Cadeiras", value: "1 / 4" }, { label: "Guichê 2", value: "livre ✓", ok: true }],
      },
      {
        description: "Clientes 4 e 5 chegam com pedidos complexos — cada um ocupa uma cadeira.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 3 },
        ]),
        queue: [], chairs: mkChairs(4, [{ id: 0, clientId: 2 }, { id: 1, clientId: 4 }, { id: 2, clientId: 5 }]),
        managerStatus: "busy",
        heapPercent: 45,
        metrics: [{ label: "Cadeiras", value: "3 / 4", warn: true }, { label: "Heap (Promises)", value: "45%", warn: true }],
      },
      {
        description: "Gerente chama cliente 2 da cadeira — cadeira 1 libera. Outro pedido complexo chega.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
        ]),
        queue: [], chairs: mkChairs(4, [{ id: 0, clientId: 6 }, { id: 1, clientId: 4 }, { id: 2, clientId: 5 }]),
        managerStatus: "busy",
        heapPercent: 52,
        metrics: [{ label: "Cadeiras", value: "3 / 4" }, { label: "Throughput", value: "+40%", ok: true }],
      },
      {
        description: "Mais pedidos complexos chegando. Cadeira 4 também ocupada. Heap sobe.",
        tellers: mkTellers(6, [{ id: 0, status: "busy", clientId: 1 }]),
        queue: [7, 8], chairs: mkChairs(4, [
          { id: 0, clientId: 6 }, { id: 1, clientId: 4 },
          { id: 2, clientId: 5 }, { id: 3, clientId: 9 },
        ]),
        managerStatus: "busy",
        heapPercent: 72,
        metrics: [{ label: "Cadeiras", value: "4 / 4 ⚠️", warn: true }, { label: "Heap", value: "72% ⚠️", warn: true }],
      },
      {
        description: "Todas as cadeiras cheias. Próximo pedido complexo aguarda na fila — backpressure natural.",
        tellers: mkTellers(6, [{ id: 0, status: "busy", clientId: 1 }]),
        queue: [7, 8, 10], chairs: mkChairs(4, [
          { id: 0, clientId: 6 }, { id: 1, clientId: 4 },
          { id: 2, clientId: 5 }, { id: 3, clientId: 9 },
        ]),
        managerStatus: "busy",
        heapPercent: 78,
        outcome: "⚠️ async/await libera o event loop, mas Promises ilimitadas esgotam o heap. Cadeiras = controle de memória.",
        code: `// ✅ async/await — event loop livre
app.get('/credito', async (req, res) => {
  const result = await creditService.analyze(req.body);
  res.json(result); // heap cresce com cada Promise aberta
});

// ⚠️ Sem limite: 500 reqs = 500 Promises no heap
// → FATAL: JavaScript heap out of memory`,
        metrics: [
          { label: "Cadeiras", value: "4 / 4 ⚠️", warn: true },
          { label: "Heap", value: "78% 🔴", warn: true },
          { label: "Backpressure", value: "ativo ✓", ok: true },
        ],
      },
    ],
  },

  /* ── 5. Auto Scaling ─────────────────────────────────── */
  auto_scaling: {
    title: "Auto Scaling", subtitle: "Kubernetes HPA — escala com a demanda",
    color: "#10B981", emoji: "📈",
    steps: [
      {
        description: "Manhã — apenas 2 pods ativos (mínimo configurado). Custo baixo.",
        tellers: mkTellers(2),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        podCount: 2,
        metrics: [{ label: "Pods", value: "2 (min)" }, { label: "CPU", value: "12%", ok: true }, { label: "Custo", value: "mínimo ✓", ok: true }],
      },
      {
        description: "Clientes chegando. G1 e G2 ocupados, CPU sobe. Fila começa a crescer.",
        tellers: mkTellers(2, [{ id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 }]),
        queue: [3, 4], chairs: mkChairs(0), managerStatus: "free",
        podCount: 2,
        metrics: [{ label: "CPU", value: "58%", warn: true }, { label: "Fila", value: "2 clientes", warn: true }],
      },
      {
        description: "CPU > 70% — HPA detecta. Provisiona pod 3.",
        tellers: mkTellers(3, [{ id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 }]),
        queue: [3, 4, 5], chairs: mkChairs(0), managerStatus: "free",
        podCount: 3,
        metrics: [{ label: "Pods", value: "2 → 3 📈", ok: true }, { label: "CPU", value: "71% (trigger)", warn: true }],
      },
      {
        description: "Fila ainda crescendo. HPA provisiona pods 4 e 5.",
        tellers: mkTellers(5, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 },
        ]),
        queue: [4, 5, 6, 7], chairs: mkChairs(0), managerStatus: "free",
        podCount: 5,
        metrics: [{ label: "Pods", value: "3 → 5 📈", ok: true }, { label: "Fila", value: "4 clientes", warn: true }],
      },
      {
        description: "Pico total. HPA sobe para 8 pods. Fila absorvida.",
        tellers: mkTellers(8, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 }, { id: 3, status: "busy", clientId: 4 },
          { id: 4, status: "busy", clientId: 5 }, { id: 5, status: "busy", clientId: 6 },
          { id: 6, status: "busy", clientId: 7 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        podCount: 8,
        metrics: [{ label: "Pods", value: "8 📈", ok: true }, { label: "Fila", value: "vazia ✓", ok: true }, { label: "CPU", value: "55%", ok: true }],
      },
      {
        description: "Pico passa. Fila zerou. HPA começa a escalar para baixo — remove pods 8 e 7.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        podCount: 6,
        metrics: [{ label: "Pods", value: "8 → 6 📉", ok: true }, { label: "CPU", value: "32%", ok: true }],
      },
      {
        description: "Movimento fraco. HPA remove mais pods até o mínimo de 2.",
        tellers: mkTellers(2, [{ id: 0, status: "busy", clientId: 1 }]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        podCount: 2,
        outcome: "✅ Auto-scaling: cresce no pico, encolhe no vale. Custo proporcional ao uso real.",
        code: `# Kubernetes HPA — escala por CPU ou profundidade de fila
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70`,
        metrics: [
          { label: "Pods", value: "2 (mínimo ✓)", ok: true },
          { label: "CPU", value: "15%", ok: true },
          { label: "Economia vs fixo", value: "~60%", ok: true },
        ],
      },
    ],
  },

  /* ── 6. Retry + Backoff ──────────────────────────────── */
  retry_backoff: {
    title: "Retry + Backoff", subtitle: "Exponential backoff — não martelar o serviço",
    color: "#F97316", emoji: "🔁",
    steps: [
      {
        description: "6 guichês. Cliente 2 chega com pedido complexo — precisa do gerente.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "busy", clientId: 2 },
        ]),
        queue: [3], chairs: mkChairs(0), managerStatus: "free",
        metrics: [{ label: "Gerente", value: "disponível" }, { label: "Pedido", value: "complexo" }],
      },
      {
        description: "Guichê 2 vai até o gerente — ele está em reunião. Indisponível.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "waiting_manager", clientId: 2 },
        ]),
        queue: [3], chairs: mkChairs(0), managerStatus: "unavailable",
        retryInfo: { attempt: 1, maxAttempts: 3, waitLabel: "—" },
        metrics: [{ label: "Tentativa", value: "1 / 3" }, { label: "Gerente", value: "indisponível ❌", warn: true }],
      },
      {
        description: "Falhou. Atendente aguarda 1s antes de tentar de novo (não fica insistindo).",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "waiting_manager", clientId: 2 },
        ]),
        queue: [3], chairs: mkChairs(0), managerStatus: "unavailable",
        retryInfo: { attempt: 1, maxAttempts: 3, waitLabel: "aguardando 1s…" },
        metrics: [{ label: "Intervalo", value: "1s (2⁰)" }, { label: "Pressão no gerente", value: "mínima ✓", ok: true }],
      },
      {
        description: "2ª tentativa — gerente ainda em reunião.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "waiting_manager", clientId: 2 },
        ]),
        queue: [3], chairs: mkChairs(0), managerStatus: "unavailable",
        retryInfo: { attempt: 2, maxAttempts: 3, waitLabel: "—" },
        metrics: [{ label: "Tentativa", value: "2 / 3" }, { label: "Gerente", value: "ainda ocupado ❌", warn: true }],
      },
      {
        description: "Falhou de novo. Aguarda 2s — intervalo dobra a cada falha.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "waiting_manager", clientId: 2 },
        ]),
        queue: [3], chairs: mkChairs(0), managerStatus: "unavailable",
        retryInfo: { attempt: 2, maxAttempts: 3, waitLabel: "aguardando 2s…" },
        metrics: [{ label: "Intervalo", value: "2s (2¹)" }, { label: "Total esperado", value: "3s até agora" }],
      },
      {
        description: "3ª tentativa — gerente saiu da reunião. Disponível!",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "waiting_manager", clientId: 2 },
        ]),
        queue: [3], chairs: mkChairs(0), managerStatus: "free",
        retryInfo: { attempt: 3, maxAttempts: 3, waitLabel: "—" },
        metrics: [{ label: "Tentativa", value: "3 / 3" }, { label: "Gerente", value: "disponível ✓", ok: true }],
      },
      {
        description: "Consulta concluída. Atendimento finalizado. Total de espera: ~3s. Serviço intacto.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        outcome: "✅ Exponential backoff dá tempo ao serviço de se recuperar. Evita thundering herd e cascata de falhas.",
        code: `async function withBackoff(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      // 1s, 2s, 4s — com jitter p/ evitar sincronismo
      const delay = Math.pow(2, attempt) * 1000
        + Math.random() * 500;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}`,
        metrics: [
          { label: "Resultado", value: "✅ sucesso", ok: true },
          { label: "Espera total", value: "~3s", ok: true },
          { label: "Pressão no serviço", value: "mínima ✓", ok: true },
        ],
      },
    ],
  },

  /* ── 7. Sobrecarga ───────────────────────────────────── */
  overflow: {
    title: "Sobrecarga", subtitle: "Sem limite de concorrência → OOM",
    color: "#DC2626", emoji: "💥",
    steps: [
      {
        description: "Tudo parece normal. Clientes chegando, guichês atendendo.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 },
        ]),
        queue: [4], chairs: mkChairs(4, [{ id: 0, clientId: 5 }]),
        managerStatus: "busy", heapPercent: 20,
        metrics: [{ label: "Promises abertas", value: "4" }, { label: "Heap", value: "20%", ok: true }],
      },
      {
        description: "Volume cresce. Sem limite: cada novo pedido vira uma Promise imediatamente.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy" }, { id: 1, status: "busy" },
          { id: 2, status: "busy" }, { id: 3, status: "busy" },
        ]),
        queue: [4, 5], chairs: mkChairs(4, [{ id: 0, clientId: 6 }, { id: 1, clientId: 7 }, { id: 2, clientId: 8 }]),
        managerStatus: "busy", heapPercent: 38,
        metrics: [{ label: "Promises abertas", value: "10" }, { label: "Heap", value: "38%" }],
      },
      {
        description: "Mais requisições chegando. Todas viram Promises — área de espera lotando.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy" }, { id: 1, status: "busy" },
          { id: 2, status: "busy" }, { id: 3, status: "busy" },
          { id: 4, status: "busy" }, { id: 5, status: "busy" },
        ]),
        queue: [9, 10, 11], chairs: mkChairs(4, [
          { id: 0, clientId: 6 }, { id: 1, clientId: 7 },
          { id: 2, clientId: 8 }, { id: 3, clientId: 12 },
        ]),
        managerStatus: "busy", heapPercent: 55,
        metrics: [{ label: "Promises abertas", value: "22", warn: true }, { label: "Heap", value: "55% ⚠️", warn: true }],
      },
      {
        description: "Pico intenso. Heap subindo rapidamente. Atendentes começando a travar.",
        tellers: mkTellers(6, [
          { id: 0, status: "overloaded" }, { id: 1, status: "overloaded" },
          { id: 2, status: "busy" }, { id: 3, status: "busy" },
          { id: 4, status: "busy" }, { id: 5, status: "busy" },
        ]),
        queue: [9, 10, 11, 13, 14, 15], chairs: mkChairs(4, [
          { id: 0, clientId: 6 }, { id: 1, clientId: 7 },
          { id: 2, clientId: 8 }, { id: 3, clientId: 12 },
        ]),
        managerStatus: "busy", heapPercent: 72,
        metrics: [{ label: "Promises abertas", value: "60+", warn: true }, { label: "Heap", value: "72% 🔴", warn: true }, { label: "CPU", value: "85%", warn: true }],
      },
      {
        description: "Heap crítico. Gerente pergunta: 'quantos clientes esperando?' — Atendente entra em colapso.",
        tellers: mkTellers(6, [
          { id: 0, status: "overloaded" }, { id: 1, status: "overloaded" },
          { id: 2, status: "overloaded" }, { id: 3, status: "overloaded" },
          { id: 4, status: "overloaded" }, { id: 5, status: "overloaded" },
        ]),
        queue: [9, 10, 11, 13, 14, 15, 16, 17], chairs: mkChairs(4, [
          { id: 0, clientId: 6 }, { id: 1, clientId: 7 },
          { id: 2, clientId: 8 }, { id: 3, clientId: 12 },
        ]),
        managerStatus: "busy", heapPercent: 91, cpuPercent: 98,
        isWarning: true,
        metrics: [{ label: "Promises", value: "150+ 🔴", warn: true }, { label: "Heap", value: "91% 🔴", warn: true }, { label: "CPU", value: "98% 🔴", warn: true }],
      },
      {
        description: "Node.js esgotou heap. Processo morto. Nenhum cliente atendido.",
        tellers: mkTellers(6, [
          { id: 0, status: "overloaded" }, { id: 1, status: "overloaded" },
          { id: 2, status: "overloaded" }, { id: 3, status: "overloaded" },
          { id: 4, status: "overloaded" }, { id: 5, status: "overloaded" },
        ]),
        queue: [], chairs: mkChairs(4, [
          { id: 0, clientId: 6 }, { id: 1, clientId: 7 },
          { id: 2, clientId: 8 }, { id: 3, clientId: 12 },
        ]),
        managerStatus: "unavailable", heapPercent: 100, cpuPercent: 0,
        outcome: "💥 FATAL: JavaScript heap out of memory — serviço morto. Concorrência irrestrita é tão destrutiva quanto I/O síncrono.",
        isWarning: true,
        code: `// ❌ Sem backpressure — heap explode
app.post('/operacao', async (req, res) => {
  // 500 reqs = 500 Promises abertas ao mesmo tempo
  const r = await servicoExterno(req.body);
  res.json(r);
});

// Terminal:
// FATAL ERROR: Reached heap limit
// Allocation failed - JavaScript heap out of memory`,
        metrics: [
          { label: "Status", value: "💥 CRASHED", warn: true },
          { label: "Heap", value: "OOM ❌", warn: true },
          { label: "Atendimentos", value: "0", warn: true },
        ],
      },
    ],
  },

  /* ── 8. Prefetch / Bulkhead ──────────────────────────── */
  prefetch: {
    title: "Prefetch / Bulkhead", subtitle: "Limite de concorrência alinhado à capacidade",
    color: "#06B6D4", emoji: "🛡️",
    steps: [
      {
        description: "Configuração: prefetch = 3. Atendente só aceita até 3 clientes simultâneos.",
        tellers: mkTellers(6),
        queue: [1, 2, 3, 4, 5, 6, 7], chairs: mkChairs(0), managerStatus: "free",
        heapPercent: 8,
        metrics: [{ label: "Prefetch", value: "3 (limite)" }, { label: "Heap", value: "8%", ok: true }],
      },
      {
        description: "Cliente 1 entra — slot 1/3 ocupado.",
        tellers: mkTellers(6, [{ id: 0, status: "busy", clientId: 1 }]),
        queue: [2, 3, 4, 5, 6, 7], chairs: mkChairs(0), managerStatus: "free",
        heapPercent: 12,
        metrics: [{ label: "Slots", value: "1 / 3 ocupado" }, { label: "Fila aguarda", value: "6" }],
      },
      {
        description: "Cliente 2 entra — slot 2/3 ocupado.",
        tellers: mkTellers(6, [{ id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 }]),
        queue: [3, 4, 5, 6, 7], chairs: mkChairs(0), managerStatus: "free",
        heapPercent: 16,
        metrics: [{ label: "Slots", value: "2 / 3 ocupados" }, { label: "Fila aguarda", value: "5" }],
      },
      {
        description: "Cliente 3 entra — slot 3/3. Prefetch atingido. Fila aguarda.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 },
        ]),
        queue: [4, 5, 6, 7], chairs: mkChairs(0), managerStatus: "free",
        heapPercent: 20,
        metrics: [{ label: "Slots", value: "3 / 3 — cheio ✓" }, { label: "Heap", value: "20% estável ✓", ok: true }, { label: "Backpressure", value: "ativo ✓", ok: true }],
      },
      {
        description: "Clientes 4, 5, 6 chegam. Aguardam na fila — atendente não pega mais até liberar slot.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 },
        ]),
        queue: [4, 5, 6, 7, 8, 9], chairs: mkChairs(0), managerStatus: "free",
        heapPercent: 22,
        metrics: [{ label: "Fila aguarda", value: "6" }, { label: "Heap", value: "22% estável ✓", ok: true }],
      },
      {
        description: "Cliente 1 finalizado. Slot 1 liberado. Cliente 4 entra imediatamente.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 4 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 },
        ]),
        queue: [5, 6, 7, 8, 9], chairs: mkChairs(0), managerStatus: "free",
        heapPercent: 21,
        metrics: [{ label: "Slots", value: "3 / 3 — cheio" }, { label: "Heap", value: "21% — não cresce ✓", ok: true }],
      },
      {
        description: "Ciclo se repete. Heap permanece estável. Throughput no máximo seguro.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 5 }, { id: 1, status: "busy", clientId: 6 },
          { id: 2, status: "busy", clientId: 7 },
        ]),
        queue: [8, 9, 10, 11], chairs: mkChairs(0), managerStatus: "free",
        heapPercent: 22,
        outcome: "✅ Prefetch + Bulkhead: concorrência controlada. Heap estável, CPU previsível, zero OOM.",
        code: `// RabbitMQ — prefetch alinhado à capacidade
channel.prefetch(3);
channel.consume('fila', async (msg) => {
  await processarMensagem(msg);
  channel.ack(msg); // libera slot p/ próxima
});

// HTTP — p-limit (Bulkhead)
import pLimit from 'p-limit';
const limit = pLimit(3); // máx 3 Promises simultâneas

await Promise.all(
  requests.map(req => limit(() => processar(req)))
);`,
        metrics: [
          { label: "Heap", value: "22% estável ✓", ok: true },
          { label: "Throughput", value: "máximo seguro ✓", ok: true },
          { label: "OOM risk", value: "zero ✓", ok: true },
        ],
      },
    ],
  },
};

/* ─── Sub-components ────────────────────────────────────────────────────── */

const TELLER_CONFIG = {
  idle:            { bg: "bg-zinc-100 dark:bg-zinc-800/60", border: "border-zinc-300 dark:border-zinc-700", icon: "😴", label: "Livre",       labelColor: "text-zinc-400" },
  busy:            { bg: "bg-blue-50  dark:bg-blue-950/40", border: "border-blue-300 dark:border-blue-700", icon: "💼", label: "Atendendo",   labelColor: "text-blue-500" },
  waiting_manager: { bg: "bg-amber-50 dark:bg-amber-950/30",border: "border-amber-400 dark:border-amber-600",icon: "⏳", label: "Aguard.",     labelColor: "text-amber-500" },
  overloaded:      { bg: "bg-red-50   dark:bg-red-950/40",  border: "border-red-500 dark:border-red-600",   icon: "😵", label: "Colapso",     labelColor: "text-red-500" },
};

function TellerCard({ teller, color }: { teller: TellerState; color: string }) {
  const cfg = TELLER_CONFIG[teller.status];
  const pulse = teller.status === "busy" || teller.status === "waiting_manager";
  return (
    <div className={`relative flex flex-col items-center justify-center rounded-xl border-2 gap-1 px-2 py-2 transition-all duration-500 ${cfg.bg} ${cfg.border}`}
      style={{ minWidth: 52, minHeight: 64 }}>
      <span className={`text-xl leading-none ${pulse ? "animate-pulse" : ""}`}>{cfg.icon}</span>
      <span className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400">G{teller.id + 1}</span>
      {teller.clientId !== undefined && (
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-md"
          style={{ backgroundColor: color }}>
          {teller.clientId}
        </span>
      )}
      <span className={`text-[7px] font-semibold ${cfg.labelColor}`}>{cfg.label}</span>
    </div>
  );
}

function ClientChip({ id, variant }: { id: number; variant: "queue" | "chair" }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow transition-all duration-500 ${variant === "chair" ? "animate-pulse" : ""}`}
      style={{ backgroundColor: variant === "chair" ? "#8B5CF6" : "#6B7280" }}>
      {id}
    </div>
  );
}

function ManagerCard({ status, color }: { status: Step["managerStatus"]; color: string }) {
  const cfg =
    status === "free"        ? { icon: "🧑‍💼", label: "Disponível", bg: "bg-green-50 dark:bg-green-950/20", border: "border-green-300 dark:border-green-700", text: "text-green-600 dark:text-green-400" } :
    status === "busy"        ? { icon: "🤝", label: "Ocupado",     bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-400 dark:border-amber-600", text: "text-amber-600 dark:text-amber-400" } :
                               { icon: "🚫", label: "Indisponível",bg: "bg-red-50 dark:bg-red-950/20",     border: "border-red-400 dark:border-red-600",     text: "text-red-600 dark:text-red-400" };
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border-2 p-3 gap-1 transition-all duration-500 ${cfg.bg} ${cfg.border}`}>
      <span className="text-2xl leading-none">{cfg.icon}</span>
      <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">Gerente</span>
      <span className={`text-[10px] font-black ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

function HeapBar({ percent, label = "Heap" }: { percent: number; label?: string }) {
  const color = percent >= 90 ? "#DC2626" : percent >= 65 ? "#F59E0B" : "#10B981";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[9px] font-semibold text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
        <span>{label}</span>
        <span style={{ color }}>{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function RetryTimeline({ info }: { info: NonNullable<Step["retryInfo"]> }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 px-3 py-2">
      <span className="text-xs font-bold text-orange-500">🔁 Retry</span>
      <div className="flex gap-1">
        {Array.from({ length: info.maxAttempts }, (_, i) => (
          <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border-2 transition-all duration-500 ${
            i < info.attempt ? "bg-orange-500 border-orange-500 text-white" :
            i === info.attempt - 1 ? "bg-orange-100 border-orange-400 text-orange-600 animate-pulse" :
            "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-400"
          }`}>{i + 1}</div>
        ))}
      </div>
      {info.waitLabel !== "—" && (
        <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold ml-1">{info.waitLabel}</span>
      )}
    </div>
  );
}

function PodBadge({ count, color }: { count: number; color: string }) {
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {Array.from({ length: Math.min(count, 10) }, (_, i) => (
        <div key={i} className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-black text-white transition-all duration-500"
          style={{ backgroundColor: color }}>▣</div>
      ))}
      <span className="text-[9px] font-bold ml-1" style={{ color }}>{count} pods</span>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */

interface Props {
  /** If given, locks to this scenario (no tabs) */
  initialScenario?: ScenarioId;
}

export default function BankParallelismAnimation({ initialScenario }: Props) {
  const allScenarios = Object.keys(SCENARIOS) as ScenarioId[];
  const [scenario, setScenario] = useState<ScenarioId>(initialScenario ?? "basic_queue");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const prevStepRef = useRef(0);

  const def = SCENARIOS[scenario];
  const steps = def.steps;
  const current = steps[step];
  const locked = !!initialScenario;

  useEffect(() => {
    prevStepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (step < steps.length - 1) setStep(s => s + 1);
      else setPlaying(false);
    }, 2200);
    return () => clearTimeout(t);
  }, [playing, step, steps.length]);

  function switchScenario(s: ScenarioId) {
    setScenario(s);
    setStep(0);
    setPlaying(false);
  }

  return (
    <div className="my-8 rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] overflow-hidden bg-[var(--color-surface)] dark:bg-zinc-950 shadow-sm">

      {/* ── Header ── */}
      <div className="px-5 pt-4 pb-3 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{def.emoji}</span>
          <div>
            <p className="text-sm font-black text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] leading-none">
              {def.title}
            </p>
            <p className="text-[10px] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mt-0.5">{def.subtitle}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button key={i} onClick={() => { setStep(i); setPlaying(false); }}
                className="rounded-full transition-all duration-300"
                style={{ width: i === step ? 10 : 7, height: i === step ? 10 : 7, backgroundColor: i <= step ? def.color : "#d1d5db" }} />
            ))}
          </div>
        </div>

        {/* Scenario tabs (only when not locked) */}
        {!locked && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {allScenarios.map(s => (
              <button key={s} onClick={() => switchScenario(s)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border"
                style={scenario === s
                  ? { backgroundColor: SCENARIOS[s].color, color: "#fff", borderColor: SCENARIOS[s].color }
                  : { backgroundColor: "transparent", color: "var(--color-muted)", borderColor: "var(--color-border)" }}>
                {SCENARIOS[s].emoji} {SCENARIOS[s].title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Bank floor ── */}
      <div className="p-4 space-y-3">

        {/* Tellers */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mb-2">
            🏦 Guichês de Atendimento
          </p>
          <div className="flex flex-wrap gap-2">
            {current.tellers.map(t => <TellerCard key={t.id} teller={t} color={def.color} />)}
          </div>
        </div>

        {/* Lower zones grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

          {/* Queue */}
          <div className="rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-zinc-50 dark:bg-zinc-900/40 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">📋 Fila</p>
              {current.queue.length > 0 && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: current.queue.length > 5 ? "#EF4444" : def.color }}>
                  {current.queue.length}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[36px] items-start content-start">
              {current.queue.slice(0, 12).map(id => <ClientChip key={id} id={id} variant="queue" />)}
              {current.queue.length > 12 && (
                <span className="text-[9px] text-[var(--color-muted)] self-center">+{current.queue.length - 12}</span>
              )}
              {current.queue.length === 0 && (
                <span className="text-[10px] text-zinc-400 italic">vazia ✓</span>
              )}
            </div>
          </div>

          {/* Chairs / waiting area */}
          <div className="rounded-xl border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-950/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">💺 Área de Espera</p>
              {current.chairs.length > 0 && (
                <span className="text-[9px] font-black text-purple-500">
                  {current.chairs.filter(c => c.occupied).length}/{current.chairs.length}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 min-h-[36px] items-start content-start">
              {current.chairs.length === 0 && (
                <span className="text-[10px] text-zinc-400 italic">sem cadeiras</span>
              )}
              {current.chairs.map(c => (
                <div key={c.id} className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-[9px] font-black transition-all duration-500 ${
                  c.occupied
                    ? "bg-purple-100 dark:bg-purple-900/40 border-purple-400 text-purple-700 dark:text-purple-300 animate-pulse"
                    : "bg-zinc-100 dark:bg-zinc-800 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-400"
                }`}>
                  {c.occupied ? c.clientId : "—"}
                </div>
              ))}
            </div>
            {/* heap bar shown here when relevant */}
            {current.heapPercent !== undefined && (
              <div className="mt-2">
                <HeapBar percent={current.heapPercent} label="Heap usado" />
              </div>
            )}
          </div>

          {/* Manager + extras */}
          <div className="flex flex-col gap-2">
            <ManagerCard status={current.managerStatus} color={def.color} />
            {current.retryInfo && <RetryTimeline info={current.retryInfo} />}
            {current.podCount !== undefined && (
              <div className="rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-zinc-50 dark:bg-zinc-900/40 p-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mb-1.5">☁️ Pods ativos</p>
                <PodBadge count={current.podCount} color={def.color} />
              </div>
            )}
            {current.cpuPercent !== undefined && (
              <div className="px-2 py-1.5 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-zinc-50 dark:bg-zinc-900/40">
                <HeapBar percent={current.cpuPercent} label="CPU" />
              </div>
            )}
          </div>
        </div>

        {/* Metrics strip */}
        <div className="flex flex-wrap gap-2">
          {current.metrics.map(m => (
            <div key={m.label}
              className={`rounded-lg border px-3 py-1.5 transition-all duration-500 ${
                m.warn ? "border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20" :
                m.ok  ? "border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-950/20" :
                "border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-zinc-50 dark:bg-zinc-900/40"
              }`}>
              <p className="text-[8px] uppercase tracking-wider text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">{m.label}</p>
              <p className={`text-xs font-black mt-0.5 ${m.warn ? "text-red-600 dark:text-red-400" : m.ok ? "text-green-600 dark:text-green-400" : "text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]"}`}>
                {m.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step description ── */}
      <div className="px-4 pb-3">
        <div className="rounded-xl bg-zinc-100 dark:bg-zinc-900 px-4 py-3 border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mb-1 font-semibold uppercase tracking-widest">
            Passo {step + 1} / {steps.length}
          </p>
          <p className="text-sm text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] font-medium leading-snug">
            {current.description}
          </p>
        </div>
      </div>

      {/* ── Code ── */}
      {current.code && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden border border-zinc-700/50">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#141414]">
            <div className="flex gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500/70"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"/><div className="w-2.5 h-2.5 rounded-full bg-green-500/70"/></div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Node.js</span>
          </div>
          <pre className="overflow-x-auto p-4 bg-[#1c1c1c] text-[11px] leading-[1.7] m-0 text-zinc-300 font-mono">
            {current.code}
          </pre>
        </div>
      )}

      {/* ── Outcome ── */}
      {current.outcome && (
        <div className="mx-4 mb-3 rounded-xl px-4 py-3 text-sm font-semibold leading-snug"
          style={current.isWarning
            ? { background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5" }
            : { background: "#f0fdf4", color: "#166534", border: "1px solid #86efac" }}>
          {current.outcome}
        </div>
      )}

      {/* ── Controls ── */}
      <div className="px-4 py-3 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex items-center gap-2 flex-wrap bg-zinc-50/50 dark:bg-zinc-900/20">
        <button onClick={() => { setStep(0); setPlaying(false); }}
          className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors">
          ↺
        </button>
        <button onClick={() => { setStep(s => Math.max(0, s - 1)); setPlaying(false); }} disabled={step === 0}
          className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] disabled:opacity-25 text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] transition-colors">
          ← Ant
        </button>
        <button onClick={() => setPlaying(p => !p)}
          className="px-5 py-1.5 text-[11px] font-black rounded-lg text-white transition-colors shadow-sm"
          style={{ backgroundColor: def.color }}>
          {playing ? "⏸ Pausar" : "▶ Play"}
        </button>
        <button onClick={() => { setStep(s => Math.min(steps.length - 1, s + 1)); setPlaying(false); }} disabled={step === steps.length - 1}
          className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] disabled:opacity-25 text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] transition-colors">
          Próx →
        </button>
        <div className="flex gap-1.5 ml-auto items-center">
          {steps.map((_, i) => (
            <button key={i} onClick={() => { setStep(i); setPlaying(false); }}
              className="rounded-full transition-all duration-300"
              style={{ width: i === step ? 10 : 6, height: i === step ? 10 : 6, backgroundColor: i <= step ? def.color : "#d1d5db" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

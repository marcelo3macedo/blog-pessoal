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
    title: "Fila Simples", subtitle: "6 atendentes síncronos",
    color: "#3B82F6", emoji: "🏦",
    steps: [
      {
        description: "Manhã tranquila — 6 guichês, clientes chegam devagar. Cada atendimento leva ~3 min.",
        tellers: mkTellers(6, [{ id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 }]),
        queue: [3], chairs: mkChairs(0), managerStatus: "free",
        metrics: [
          { label: "Fila", value: "1 cliente" },
          { label: "Espera média", value: "3 min", ok: true },
          { label: "Guichês ativos", value: "2 / 6" },
        ],
      },
      {
        description: "12h — horário de pico. Todos os guichês ocupados e fila crescendo.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 }, { id: 3, status: "busy", clientId: 4 },
          { id: 4, status: "busy", clientId: 5 }, { id: 5, status: "busy", clientId: 6 },
        ]),
        queue: [7, 8, 9, 10, 11, 12], chairs: mkChairs(0), managerStatus: "free",
        metrics: [
          { label: "Fila", value: "6 clientes", warn: true },
          { label: "Espera média", value: "18 min", warn: true },
          { label: "Guichês ativos", value: "6 / 6" },
        ],
      },
      {
        description: "Fila explodiu. O atendimento de um cliente bloqueia todos os outros. Insatisfação em alta.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy" }, { id: 1, status: "busy" }, { id: 2, status: "busy" },
          { id: 3, status: "busy" }, { id: 4, status: "busy" }, { id: 5, status: "busy" },
        ]),
        queue: [7, 8, 9, 10, 11, 12, 13, 14], chairs: mkChairs(0), managerStatus: "free",
        outcome: "❌ Node.js single-thread: processamento síncrono bloqueia o event loop para todas as requisições.",
        isWarning: true,
        code: `// ❌ Síncrono — bloqueia o event loop
app.get('/saldo', (req, res) => {
  const result = calcularSaldo(req.params.id);
  // CPU presa aqui → nenhuma outra req é processada
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
    title: "+Atendentes", subtitle: "Dobro fixo de workers",
    color: "#F59E0B", emoji: "👥",
    steps: [
      {
        description: "Gerente dobra o efetivo: 12 atendentes para absorver o pico do almoço.",
        tellers: mkTellers(12, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 }, { id: 3, status: "busy", clientId: 4 },
        ]),
        queue: [5, 6], chairs: mkChairs(0), managerStatus: "free",
        metrics: [
          { label: "Atendentes", value: "12 (fixo)" },
          { label: "Custo mensal", value: "R$ 60k", warn: true },
        ],
      },
      {
        description: "12h — pico absorvido com folga. Fila quase zerou.",
        tellers: mkTellers(12, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 }, { id: 3, status: "busy", clientId: 4 },
          { id: 4, status: "busy", clientId: 5 }, { id: 5, status: "busy", clientId: 6 },
        ]),
        queue: [7], chairs: mkChairs(0), managerStatus: "free",
        metrics: [
          { label: "Fila", value: "1 cliente", ok: true },
          { label: "Espera média", value: "5 min", ok: true },
          { label: "Ociosos", value: "6 / 12", warn: true },
        ],
      },
      {
        description: "15h — movimento fraco. 10 de 12 atendentes ociosos, custo fixo correndo.",
        tellers: mkTellers(12, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        outcome: "💸 Workers fixos = custo fixo. 83% de ociosidade fora do pico é desperdício puro de infra.",
        isWarning: true,
        code: `// PM2 cluster com instâncias fixas
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api',
    instances: 12,    // sempre 12 — mesmo às 3am
    exec_mode: 'cluster'
  }]
};`,
        metrics: [
          { label: "Ativos", value: "2 / 12", warn: true },
          { label: "Ociosidade", value: "83% 😬", warn: true },
          { label: "Custo", value: "R$ 60k/mês", warn: true },
        ],
      },
    ],
  },

  /* ── 3. Dependência do Gerente ───────────────────────── */
  manager_dep: {
    title: "Dependência Gerente", subtitle: "I/O bloqueante",
    color: "#EF4444", emoji: "⏳",
    steps: [
      {
        description: "Pedidos simples (saldo, extrato) são rápidos. 6 atendentes fluem bem.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
        ]),
        queue: [3, 4], chairs: mkChairs(0), managerStatus: "free",
        metrics: [
          { label: "Tempo médio", value: "3 min", ok: true },
          { label: "Throughput", value: "20 / h", ok: true },
        ],
      },
      {
        description: "Pedido complexo (análise de crédito) chega. Atendente 2 precisa do gerente.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "waiting_manager", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 },
        ]),
        queue: [4, 5, 6], chairs: mkChairs(0), managerStatus: "busy",
        metrics: [
          { label: "Guichê 2", value: "BLOQUEADO ⏳", warn: true },
          { label: "Gerente", value: "ocupado", warn: true },
        ],
      },
      {
        description: "Guichê 2 parado há 8 min esperando o gerente. Fila atrás dele cresce.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "waiting_manager", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 },
        ]),
        queue: [4, 5, 6, 7, 8], chairs: mkChairs(0), managerStatus: "busy",
        outcome: "❌ I/O síncrono: thread presa esperando banco/API. Event loop bloqueado para esse worker.",
        isWarning: true,
        code: `// ❌ Thread presa aguardando I/O externo
app.get('/credito', (req, res) => {
  // Sem async: bloqueia até o serviço responder
  const r = http.get(creditServiceUrl); // bloqueia!
  res.json(r);
});`,
        metrics: [
          { label: "Guichê 2 parado", value: "8 min ❌", warn: true },
          { label: "Clientes afetados", value: "fila inteira", warn: true },
          { label: "Throughput", value: "↓ 40%", warn: true },
        ],
      },
    ],
  },

  /* ── 4. Async / Cadeiras ─────────────────────────────── */
  async_chairs: {
    title: "Async / Cadeiras", subtitle: "await não-bloqueante + backpressure",
    color: "#8B5CF6", emoji: "💺",
    steps: [
      {
        description: "Nova política: pedido complexo → cliente senta na área de espera. Atendente já chama o próximo.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "busy", clientId: 3 },
        ]),
        queue: [4, 5], chairs: mkChairs(4, [{ id: 0, clientId: 2 }]),
        managerStatus: "busy",
        metrics: [
          { label: "Cadeiras", value: "1 / 4" },
          { label: "Throughput", value: "+40%", ok: true },
          { label: "Guichê 2", value: "livre ✓", ok: true },
        ],
      },
      {
        description: "Pico: 3 clientes esperando o gerente. Guichês continuam atendendo normalmente.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 4 },
          { id: 2, status: "busy", clientId: 5 },
        ]),
        queue: [6, 7], chairs: mkChairs(4, [
          { id: 0, clientId: 2 }, { id: 1, clientId: 3 }, { id: 2, clientId: 8 },
        ]),
        managerStatus: "busy",
        metrics: [
          { label: "Cadeiras", value: "3 / 4" },
          { label: "Heap", value: "crescendo ⚠️", warn: true },
        ],
      },
      {
        description: "Todas as 4 cadeiras ocupadas. Próximo que precisar do gerente espera na fila — backpressure natural.",
        tellers: mkTellers(6, [{ id: 0, status: "busy", clientId: 1 }]),
        queue: [6, 7, 8], chairs: mkChairs(4, [
          { id: 0, clientId: 2 }, { id: 1, clientId: 3 },
          { id: 2, clientId: 4 }, { id: 3, clientId: 5 },
        ]),
        managerStatus: "busy",
        heapPercent: 78,
        outcome: "⚠️ async/await libera o event loop, mas Promises ilimitadas esgotam o heap. Limite de cadeiras = controle de memória.",
        code: `// ✅ async/await — event loop livre
app.get('/credito', async (req, res) => {
  // Suspende essa fn, libera o loop p/ outras reqs
  const result = await creditService.analyze(req.body);
  res.json(result);
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
    title: "Auto Scaling", subtitle: "Kubernetes HPA / KEDA",
    color: "#10B981", emoji: "📈",
    steps: [
      {
        description: "Vale — movimento fraco. Apenas 2 atendentes ativos (mínimo configurado).",
        tellers: mkTellers(2, [
          { id: 0, status: "busy", clientId: 1 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        podCount: 2,
        metrics: [
          { label: "Pods", value: "2 (mínimo)" },
          { label: "CPU", value: "12%", ok: true },
          { label: "Custo", value: "mínimo ✓", ok: true },
        ],
      },
      {
        description: "Fila atingiu limite X → HPA detecta e provisiona pods extras.",
        tellers: mkTellers(7, [
          { id: 0, status: "busy", clientId: 1 }, { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 }, { id: 3, status: "busy", clientId: 4 },
        ]),
        queue: [5, 6, 7, 8, 9], chairs: mkChairs(0), managerStatus: "free",
        podCount: 7,
        metrics: [
          { label: "Pods", value: "2 → 7 📈", ok: true },
          { label: "Fila", value: "5 clientes", warn: true },
          { label: "CPU", value: "71% (trigger)", warn: true },
        ],
      },
      {
        description: "Pico absorvido. Fila zerou. HPA escala para baixo, mantendo o mínimo.",
        tellers: mkTellers(2, [
          { id: 0, status: "busy", clientId: 1 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        podCount: 2,
        outcome: "✅ Auto-scaling: cresce no pico, encolhe no vale. Custo proporcional ao uso real.",
        code: `# Kubernetes HPA — escala por CPU ou fila
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
          { label: "Economia", value: "~60% vs fixo", ok: true },
        ],
      },
    ],
  },

  /* ── 6. Retry + Backoff ──────────────────────────────── */
  retry_backoff: {
    title: "Retry + Backoff", subtitle: "Exponential backoff + jitter",
    color: "#F97316", emoji: "🔁",
    steps: [
      {
        description: "Pedido complexo. Atendente vai ao gerente — mas ele está em reunião.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "waiting_manager", clientId: 2 },
        ]),
        queue: [3], chairs: mkChairs(0), managerStatus: "unavailable",
        retryInfo: { attempt: 1, maxAttempts: 3, waitLabel: "—" },
        metrics: [
          { label: "Tentativa", value: "1 / 3" },
          { label: "Gerente", value: "indisponível ❌", warn: true },
        ],
      },
      {
        description: "Gerente ainda ocupado. Atendente aguarda 2s antes de tentar de novo.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "waiting_manager", clientId: 2 },
        ]),
        queue: [3], chairs: mkChairs(0), managerStatus: "unavailable",
        retryInfo: { attempt: 2, maxAttempts: 3, waitLabel: "aguardou 2s" },
        metrics: [
          { label: "Tentativa", value: "2 / 3" },
          { label: "Intervalo", value: "2s (2¹)" },
          { label: "Pressão no gerente", value: "mínima ✓", ok: true },
        ],
      },
      {
        description: "Ainda indisponível. Aguarda 4s (backoff cresce exponencialmente).",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "waiting_manager", clientId: 2 },
        ]),
        queue: [3], chairs: mkChairs(0), managerStatus: "unavailable",
        retryInfo: { attempt: 3, maxAttempts: 3, waitLabel: "aguardou 4s" },
        metrics: [
          { label: "Tentativa", value: "3 / 3" },
          { label: "Intervalo", value: "4s (2²)" },
          { label: "Total esperado", value: "6s" },
        ],
      },
      {
        description: "Gerente disponível! Consulta concluída. Atendimento finalizado com sucesso.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 },
        ]),
        queue: [], chairs: mkChairs(0), managerStatus: "free",
        outcome: "✅ Exponential backoff dá tempo ao serviço de se recuperar — evita thundering herd e cascata de falhas.",
        code: `async function withBackoff(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries - 1) throw err;
      // 1s, 2s, 4s — com jitter para evitar sincronismo
      const delay = Math.pow(2, attempt) * 1000
        + Math.random() * 500;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}`,
        metrics: [
          { label: "Resultado", value: "✅ sucesso", ok: true },
          { label: "Espera total", value: "~6s", ok: true },
          { label: "Pressão no gerente", value: "mínima ✓", ok: true },
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
        description: "Sem limite. Cada requisição vira uma Promise imediatamente — fila de espera infinita.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy" }, { id: 1, status: "busy" },
          { id: 2, status: "busy" }, { id: 3, status: "busy" },
          { id: 4, status: "busy" }, { id: 5, status: "busy" },
        ]),
        queue: [10, 11, 12], chairs: mkChairs(4, [
          { id: 0, clientId: 7 }, { id: 1, clientId: 8 },
          { id: 2, clientId: 9 }, { id: 3, clientId: 6 },
        ]),
        managerStatus: "busy",
        heapPercent: 55,
        metrics: [
          { label: "Promises abertas", value: "38" },
          { label: "Heap", value: "55%", warn: true },
          { label: "CPU", value: "62%", warn: true },
        ],
      },
      {
        description: "Volume dobra. Gerente pergunta ao atendente quantos esperam — atendente entra em colapso.",
        tellers: mkTellers(6, [
          { id: 0, status: "overloaded" }, { id: 1, status: "overloaded" },
          { id: 2, status: "overloaded" }, { id: 3, status: "overloaded" },
          { id: 4, status: "overloaded" }, { id: 5, status: "overloaded" },
        ]),
        queue: [10, 11, 12, 13, 14, 15, 16], chairs: mkChairs(4, [
          { id: 0, clientId: 7 }, { id: 1, clientId: 8 },
          { id: 2, clientId: 9 }, { id: 3, clientId: 6 },
        ]),
        managerStatus: "busy",
        heapPercent: 91,
        cpuPercent: 98,
        isWarning: true,
        metrics: [
          { label: "Promises abertas", value: "150+ 🔴", warn: true },
          { label: "Heap", value: "91% 🔴", warn: true },
          { label: "CPU", value: "98% 🔴", warn: true },
        ],
      },
      {
        description: "Processo travado. Node.js esgotou heap. Serviço caiu. Nenhum cliente atendido.",
        tellers: mkTellers(6, [
          { id: 0, status: "overloaded" }, { id: 1, status: "overloaded" },
          { id: 2, status: "overloaded" }, { id: 3, status: "overloaded" },
          { id: 4, status: "overloaded" }, { id: 5, status: "overloaded" },
        ]),
        queue: [], chairs: mkChairs(4, [
          { id: 0, clientId: 7 }, { id: 1, clientId: 8 },
          { id: 2, clientId: 9 }, { id: 3, clientId: 6 },
        ]),
        managerStatus: "unavailable",
        heapPercent: 100,
        cpuPercent: 0,
        outcome: "💥 FATAL: JavaScript heap out of memory — serviço morto. Sem limite de concorrência é tão destrutivo quanto I/O síncrono.",
        isWarning: true,
        code: `// ❌ Sem backpressure — heap explode
app.post('/operacao', async (req, res) => {
  // 500 reqs simultâneas = 500 Promises no heap
  const r = await servicoExterno(req.body);
  res.json(r);
});

// Terminal:
// <--- Last few GCs --->
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
    title: "Prefetch / Bulkhead", subtitle: "Concorrência controlada",
    color: "#06B6D4", emoji: "🛡️",
    steps: [
      {
        description: "Prefetch = 3: atendente só pega 3 clientes por vez. Fila aguarda slots livres.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 },
        ]),
        queue: [4, 5, 6, 7, 8], chairs: mkChairs(0), managerStatus: "free",
        heapPercent: 22,
        metrics: [
          { label: "Prefetch", value: "3 (limite)" },
          { label: "Heap", value: "22% ✓", ok: true },
          { label: "CPU", value: "35% ✓", ok: true },
        ],
      },
      {
        description: "Cliente 4 chega. Aguarda na fila interna até um dos 3 slots liberar.",
        tellers: mkTellers(6, [
          { id: 0, status: "busy", clientId: 1 },
          { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 },
        ]),
        queue: [4, 5, 6, 7, 8, 9], chairs: mkChairs(0), managerStatus: "free",
        heapPercent: 25,
        metrics: [
          { label: "Fila interna", value: "6 aguardando" },
          { label: "Heap", value: "25% estável ✓", ok: true },
          { label: "Backpressure", value: "ativo ✓", ok: true },
        ],
      },
      {
        description: "Slot liberado! Cliente 4 entra. Heap estável. Throughput no máximo seguro.",
        tellers: mkTellers(6, [
          { id: 0, status: "idle" },
          { id: 1, status: "busy", clientId: 2 },
          { id: 2, status: "busy", clientId: 3 },
          { id: 3, status: "busy", clientId: 4 },
        ]),
        queue: [5, 6, 7, 8, 9], chairs: mkChairs(0), managerStatus: "free",
        heapPercent: 24,
        outcome: "✅ Prefetch + Bulkhead: limita concorrência à capacidade real. Heap estável, CPU controlada, zero OOM.",
        code: `// RabbitMQ — prefetch alinhado à capacidade
channel.prefetch(3);
channel.consume('fila', async (msg) => {
  await processarMensagem(msg);
  channel.ack(msg); // libera slot p/ próxima
});

// HTTP / qualquer fluxo — p-limit (Bulkhead)
import pLimit from 'p-limit';
const limit = pLimit(3); // máx 3 Promises simultâneas

const results = await Promise.all(
  requests.map(req => limit(() => processar(req)))
);`,
        metrics: [
          { label: "Heap", value: "24% estável ✓", ok: true },
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

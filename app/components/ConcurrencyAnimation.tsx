"use client";
import { useState, useEffect } from "react";

type Scenario = "problema" | "cancel_first" | "release_first" | "merge";
type MsgStatus =
  | "idle"
  | "sending"
  | "processing"
  | "queued"
  | "holding"
  | "delivering"
  | "delivered"
  | "cancelled"
  | "superseded";

interface Step {
  description: string;
  msgA: MsgStatus;
  msgB: MsgStatus;
  lockActive: boolean;
  redisLines: string[];
  intentDecision?: string;
  outcome?: string;
  isWarning?: boolean;
}

// 0=Usuário 1=Webhook 2=Fila 3=Consumer 4=Chat
function stageOf(s: MsgStatus): number {
  switch (s) {
    case "sending":    return 0;
    case "processing": return 1;
    case "queued":
    case "holding":
    case "cancelled":
    case "superseded": return 2;
    case "delivering": return 3;
    case "delivered":  return 4;
    default:           return -1;
  }
}

const SCENARIO_META: Record<Scenario, { title: string; color: string }> = {
  problema:      { title: "Problema",       color: "#EF4444" },
  cancel_first:  { title: "CANCEL_FIRST",   color: "#F59E0B" },
  release_first: { title: "RELEASE_FIRST",  color: "#10B981" },
  merge:         { title: "MERGE",          color: "#8B5CF6" },
};

const STEPS: Record<Scenario, Step[]> = {
  problema: [
    {
      description: 'Usuário envia mensagem A: "Quero cancelar meu pedido"',
      msgA: "sending", msgB: "idle",
      lockActive: false, redisLines: ["—"],
    },
    {
      description: "Webhook + ADK processa A, gera resposta de cancelamento",
      msgA: "processing", msgB: "idle",
      lockActive: false, redisLines: ["—"],
    },
    {
      description: "Resposta de A publicada no RabbitMQ (delay operacional: 3s)",
      msgA: "queued", msgB: "idle",
      lockActive: false, redisLines: ["—"],
    },
    {
      description: '1,5s depois: usuário envia B: "Esquece, só mudar o endereço"',
      msgA: "queued", msgB: "sending",
      lockActive: false, redisLines: ["—"],
    },
    {
      description: "Webhook processa B simultaneamente — sem saber que A ainda está em voo",
      msgA: "queued", msgB: "processing",
      lockActive: false, redisLines: ["—"],
    },
    {
      description: "B publicada. Consumer começa a despachar A (delay esgotado)",
      msgA: "delivering", msgB: "queued",
      lockActive: false, redisLines: ["—"],
    },
    {
      description: "Consumer entrega A: \"Cancelamento confirmado\" — usuário já havia desistido!",
      msgA: "delivered", msgB: "delivering",
      lockActive: false, redisLines: ["—"],
      isWarning: true,
    },
    {
      description: "Consumer entrega B: \"Endereço alterado\" — mas a confusão já foi causada",
      msgA: "delivered", msgB: "delivered",
      lockActive: false, redisLines: ["—"],
      outcome: "❌ UX quebrada: resposta obsoleta entregue fora de contexto. Desperdício de tokens em A.",
      isWarning: true,
    },
  ],
  cancel_first: [
    {
      description: 'Usuário envia A: "Quero cancelar meu pedido"',
      msgA: "sending", msgB: "idle",
      lockActive: false, redisLines: ["—"],
    },
    {
      description: "Webhook ativa lock:session no Redis. ADK processa A.",
      msgA: "processing", msgB: "idle",
      lockActive: true, redisLines: ["lock:session = ACTIVE"],
    },
    {
      description: "A publicada. Consumer tenta consumir → lock ATIVO → NACK + backoff",
      msgA: "holding", msgB: "idle",
      lockActive: true, redisLines: ["lock:session = ACTIVE", "pending:session = A"],
    },
    {
      description: '1,5s depois: usuário envia B: "Esquece, não cancela"',
      msgA: "holding", msgB: "sending",
      lockActive: true, redisLines: ["lock:session = ACTIVE", "pending:session = A"],
    },
    {
      description: "Intention Evaluator compara A e B → decisão: CANCEL_FIRST",
      msgA: "holding", msgB: "processing",
      lockActive: true, redisLines: ["lock:session = ACTIVE"],
      intentDecision: "CANCEL_FIRST",
    },
    {
      description: "Redis marca message:A = CANCELLED. Lock liberado.",
      msgA: "cancelled", msgB: "queued",
      lockActive: false, redisLines: ["lock:session = INACTIVE", "message:A = CANCELLED"],
      intentDecision: "CANCEL_FIRST",
    },
    {
      description: "Consumer lê A → status CANCELLED → descarta (ACK sem despacho)",
      msgA: "cancelled", msgB: "delivering",
      lockActive: false, redisLines: ["message:A = CANCELLED"],
      intentDecision: "CANCEL_FIRST",
    },
    {
      description: 'Consumer entrega B: "Endereço alterado com sucesso" ✅',
      msgA: "cancelled", msgB: "delivered",
      lockActive: false, redisLines: ["—"],
      intentDecision: "CANCEL_FIRST",
      outcome: "✅ Apenas a resposta relevante chegou ao usuário. Zero tokens desperdiçados em A.",
    },
  ],
  release_first: [
    {
      description: 'Usuário envia A: "Qual o horário de funcionamento?"',
      msgA: "sending", msgB: "idle",
      lockActive: false, redisLines: ["—"],
    },
    {
      description: "Webhook ativa lock:session. ADK processa A.",
      msgA: "processing", msgB: "idle",
      lockActive: true, redisLines: ["lock:session = ACTIVE"],
    },
    {
      description: "A publicada. Consumer aguarda — lock ATIVO → NACK + backoff",
      msgA: "holding", msgB: "idle",
      lockActive: true, redisLines: ["lock:session = ACTIVE", "pending:session = A"],
    },
    {
      description: 'Usuário envia B: "Vocês aceitam PIX?"',
      msgA: "holding", msgB: "sending",
      lockActive: true, redisLines: ["lock:session = ACTIVE"],
    },
    {
      description: "Intention Evaluator: mensagens independentes → RELEASE_FIRST",
      msgA: "holding", msgB: "processing",
      lockActive: true, redisLines: ["lock:session = ACTIVE"],
      intentDecision: "RELEASE_FIRST",
    },
    {
      description: "Nenhum status marcado. Lock liberado. Ambas seguem normalmente.",
      msgA: "queued", msgB: "queued",
      lockActive: false, redisLines: ["lock:session = INACTIVE"],
      intentDecision: "RELEASE_FIRST",
    },
    {
      description: 'Consumer entrega A: resposta sobre horário',
      msgA: "delivered", msgB: "delivering",
      lockActive: false, redisLines: ["—"],
      intentDecision: "RELEASE_FIRST",
    },
    {
      description: 'Consumer entrega B: resposta sobre PIX ✅',
      msgA: "delivered", msgB: "delivered",
      lockActive: false, redisLines: ["—"],
      intentDecision: "RELEASE_FIRST",
      outcome: "✅ Ambas entregues em ordem. Mensagens independentes, sem conflito.",
    },
  ],
  merge: [
    {
      description: 'Usuário envia A: "Adiciona uma pizza de calabresa"',
      msgA: "sending", msgB: "idle",
      lockActive: false, redisLines: ["—"],
    },
    {
      description: "Webhook ativa lock:session. ADK processa A.",
      msgA: "processing", msgB: "idle",
      lockActive: true, redisLines: ["lock:session = ACTIVE"],
    },
    {
      description: "A publicada. Consumer aguarda — lock ATIVO → NACK + backoff",
      msgA: "holding", msgB: "idle",
      lockActive: true, redisLines: ["lock:session = ACTIVE", "pending:session = A"],
    },
    {
      description: 'Usuário envia B: "E uma Coca 2L também"',
      msgA: "holding", msgB: "sending",
      lockActive: true, redisLines: ["lock:session = ACTIVE"],
    },
    {
      description: "Intention Evaluator: B complementa A → MERGE",
      msgA: "holding", msgB: "processing",
      lockActive: true, redisLines: ["lock:session = ACTIVE"],
      intentDecision: "MERGE",
    },
    {
      description: "Redis marca message:A = SUPERSEDED. ADK gera resposta unificada para B.",
      msgA: "superseded", msgB: "queued",
      lockActive: false, redisLines: ["lock:session = INACTIVE", "message:A = SUPERSEDED"],
      intentDecision: "MERGE",
    },
    {
      description: "Consumer lê A → status SUPERSEDED → descarta (ACK sem despacho)",
      msgA: "superseded", msgB: "delivering",
      lockActive: false, redisLines: ["message:A = SUPERSEDED"],
      intentDecision: "MERGE",
    },
    {
      description: 'Consumer entrega B: "Pizza de calabresa + Coca 2L adicionados!" ✅',
      msgA: "superseded", msgB: "delivered",
      lockActive: false, redisLines: ["—"],
      intentDecision: "MERGE",
      outcome: "✅ Usuário recebe uma única resposta consolidada com os dois itens.",
    },
  ],
};

const STAGES = [
  { label: "Usuário",       icon: "👤" },
  { label: "Webhook + ADK", icon: "⚡" },
  { label: "RabbitMQ",      icon: "📦" },
  { label: "Consumer",      icon: "🔄" },
  { label: "Chat",          icon: "💬" },
];

interface PillProps {
  label: string;
  status: MsgStatus;
  color: string;
}

function MessagePill({ label, status, color }: PillProps) {
  const bg =
    status === "cancelled"  ? "#EF4444" :
    status === "superseded" ? "#8B5CF6" :
    status === "delivered"  ? "#10B981" :
    color;

  const icon =
    status === "cancelled"  ? "✕" :
    status === "superseded" ? "~" :
    status === "delivered"  ? "✓" :
    status === "holding"    ? "⏸" :
    label;

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={[
          "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md select-none",
          status === "processing" ? "animate-pulse" : "",
          status === "holding" ? "ring-2 ring-offset-1 ring-red-400" : "",
        ].join(" ")}
        style={{ backgroundColor: bg }}
        title={`Msg ${label}: ${status}`}
      >
        {icon}
      </div>
      <span
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-semibold whitespace-nowrap"
        style={{ color: bg }}
      >
        {label}
      </span>
    </div>
  );
}

export default function ConcurrencyAnimation() {
  const [scenario, setScenario] = useState<Scenario>("problema");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const steps = STEPS[scenario];
  const current = steps[step];
  const meta = SCENARIO_META[scenario];

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (step < steps.length - 1) {
        setStep((s) => s + 1);
      } else {
        setPlaying(false);
      }
    }, 1800);
    return () => clearTimeout(t);
  }, [playing, step, steps.length]);

  function switchScenario(s: Scenario) {
    setScenario(s);
    setStep(0);
    setPlaying(false);
  }

  return (
    <div className="my-8 rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] overflow-hidden bg-[var(--color-surface)] dark:bg-zinc-950">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mb-3">
          🎬 Visualização Interativa — Pipeline de Mensagens Concorrentes
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(SCENARIO_META) as Scenario[]).map((s) => (
            <button
              key={s}
              onClick={() => switchScenario(s)}
              className="px-3 py-1 rounded-lg text-[11px] font-semibold transition-all border"
              style={
                scenario === s
                  ? { backgroundColor: SCENARIO_META[s].color, color: "#fff", borderColor: SCENARIO_META[s].color }
                  : { backgroundColor: "transparent", color: "var(--color-muted)", borderColor: "var(--color-border)" }
              }
            >
              {SCENARIO_META[s].title}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div className="px-5 pt-5 pb-2">
        {/* Stage headers */}
        <div className="grid grid-cols-5 mb-3">
          {STAGES.map((st, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="text-base leading-none">{st.icon}</span>
              <span className="text-[9px] font-semibold text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] uppercase tracking-wide text-center leading-tight">
                {st.label}
              </span>
            </div>
          ))}
        </div>

        {/* Track */}
        <div className="relative grid grid-cols-5 items-center gap-0 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden" style={{ height: 88 }}>
          {/* Dividers */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-dashed border-zinc-200 dark:border-zinc-800 pointer-events-none"
              style={{ left: `${i * 20}%` }}
            />
          ))}

          {/* Arrow connectors */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-700 text-sm pointer-events-none select-none"
              style={{ left: `${i * 20 + 17.5}%` }}
            >
              →
            </div>
          ))}

          {/* Messages per stage */}
          {STAGES.map((_, stageIdx) => {
            const aHere = stageOf(current.msgA) === stageIdx;
            const bHere = stageOf(current.msgB) === stageIdx;
            return (
              <div
                key={stageIdx}
                className="flex flex-col items-center justify-center gap-4 h-full"
              >
                {aHere && (
                  <MessagePill label="A" status={current.msgA} color={meta.color} />
                )}
                {bHere && (
                  <MessagePill label="B" status={current.msgB} color={meta.color} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Redis + Intent */}
      <div className="px-5 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 px-3 py-2">
          <span className="text-xs font-bold text-red-600 dark:text-red-400 shrink-0">🔑 Redis</span>
          <div className="min-w-0">
            {current.redisLines.map((line, i) => (
              <p key={i} className="font-mono text-[11px] text-red-700 dark:text-red-300 truncate">{line}</p>
            ))}
          </div>
          {current.lockActive && (
            <span className="ml-auto shrink-0 px-1.5 py-0.5 bg-red-500 text-white rounded text-[9px] font-bold animate-pulse">
              LOCK ON
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-3 py-2 min-h-[42px]">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">🧠 Evaluator</span>
          <span className="font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300">
            {current.intentDecision ?? "—"}
          </span>
        </div>
      </div>

      {/* Step description */}
      <div className="px-5 pt-3">
        <div className="rounded-xl bg-zinc-100 dark:bg-zinc-900 px-4 py-3">
          <p className="text-[10px] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mb-1">
            Passo {step + 1} / {steps.length}
          </p>
          <p className="text-sm text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] font-medium leading-snug">
            {current.description}
          </p>
        </div>
      </div>

      {/* Outcome / warning */}
      {current.outcome && (
        <div
          className="mx-5 mt-3 rounded-lg px-4 py-2.5 text-sm font-medium"
          style={
            current.isWarning
              ? { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }
              : { background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }
          }
        >
          {current.outcome}
        </div>
      )}

      {/* Controls */}
      <div className="px-5 py-4 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => { setStep(0); setPlaying(false); }}
          className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
        >
          ↺ Reset
        </button>
        <button
          onClick={() => { setStep((s) => Math.max(0, s - 1)); setPlaying(false); }}
          disabled={step === 0}
          className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] disabled:opacity-30 text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
        >
          ← Ant
        </button>
        <button
          onClick={() => setPlaying((p) => !p)}
          className="px-4 py-1.5 text-[11px] font-semibold rounded-lg text-white transition-colors"
          style={{ backgroundColor: meta.color }}
        >
          {playing ? "⏸ Pausar" : "▶ Play"}
        </button>
        <button
          onClick={() => { setStep((s) => Math.min(steps.length - 1, s + 1)); setPlaying(false); }}
          disabled={step === steps.length - 1}
          className="px-3 py-1.5 text-[11px] font-medium rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] disabled:opacity-30 text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] transition-colors"
        >
          Próx →
        </button>

        {/* Progress dots */}
        <div className="flex gap-1.5 ml-2 items-center">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => { setStep(i); setPlaying(false); }}
              className="rounded-full transition-all"
              style={{
                width: i === step ? 8 : 6,
                height: i === step ? 8 : 6,
                backgroundColor: i <= step ? meta.color : "#d1d5db",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

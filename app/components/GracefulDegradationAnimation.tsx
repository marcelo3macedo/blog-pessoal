"use client";
import { useState, useEffect } from "react";

type Scenario = "sem_protecao" | "modo_normal" | "leitura_degradada" | "escrita_worker";

type ReqStatus =
  | "idle"
  | "sending"          // 0: Cliente
  | "processing"       // 1: Laravel
  | "cache_hit"        // 2: Redis — leitura
  | "buffering"        // 2: Redis — escrita bufferizada
  | "worker_checking"  // 2: Redis — worker consultando cota
  | "hitting_api"      // 3: Sheets API — chamada direta
  | "draining"         // 3: Sheets API — worker drenando
  | "success"          // 4: Resposta 200
  | "error_429";       // 4: Resposta 429

function stageOf(s: ReqStatus): number {
  switch (s) {
    case "sending":                        return 0;
    case "processing":                     return 1;
    case "cache_hit":
    case "buffering":
    case "worker_checking":                return 2;
    case "hitting_api":
    case "draining":                       return 3;
    case "success":
    case "error_429":                      return 4;
    default:                               return -1;
  }
}

interface Step {
  description: string;
  reqA: ReqStatus;
  reqB: ReqStatus;
  quotaPercent: number;
  mode: "none" | "normal" | "degraded";
  redisLines: string[];
  sheetsStatus: string;
  outcome?: string;
  isWarning?: boolean;
}

const SCENARIO_META: Record<Scenario, { title: string; color: string }> = {
  sem_protecao:       { title: "Sem Proteção",      color: "#EF4444" },
  modo_normal:        { title: "Modo Normal",        color: "#10B981" },
  leitura_degradada:  { title: "Leitura Degradada",  color: "#3B82F6" },
  escrita_worker:     { title: "Escrita + Worker",   color: "#8B5CF6" },
};

const STEPS: Record<Scenario, Step[]> = {
  sem_protecao: [
    {
      description: "Cliente envia 1ª requisição (A). Tráfego ainda baixo.",
      reqA: "sending", reqB: "idle",
      quotaPercent: 40, mode: "none",
      redisLines: ["— (sem controle de cota)"],
      sheetsStatus: "aguardando",
    },
    {
      description: "Laravel sem verificação de cota → chama Sheets diretamente",
      reqA: "hitting_api", reqB: "idle",
      quotaPercent: 40, mode: "none",
      redisLines: ["— (sem controle de cota)"],
      sheetsStatus: "200 OK ✓",
    },
    {
      description: "Sheets retorna 200 ✓ — cota ainda dentro do limite (120 req/min)",
      reqA: "success", reqB: "idle",
      quotaPercent: 40, mode: "none",
      redisLines: ["— (sem controle de cota)"],
      sheetsStatus: "200 OK ✓",
    },
    {
      description: "Tráfego cresce. Cliente envia B (2ª requisição) — cota já estourada",
      reqA: "success", reqB: "sending",
      quotaPercent: 100, mode: "none",
      redisLines: ["— (sem controle de cota)"],
      sheetsStatus: "300+ req/min",
    },
    {
      description: "Laravel sem proteção → tenta chamar Sheets novamente",
      reqA: "success", reqB: "hitting_api",
      quotaPercent: 100, mode: "none",
      redisLines: ["— (sem controle de cota)"],
      sheetsStatus: "429 Too Many Requests ✕",
    },
    {
      description: "Sheets retorna 429 ✕ — cota esgotada. Laravel propaga o erro.",
      reqA: "success", reqB: "error_429",
      quotaPercent: 100, mode: "none",
      redisLines: ["— (sem controle de cota)"],
      sheetsStatus: "429 Too Many Requests ✕",
      outcome: "❌ 12,7% de erro global — erros em cascata sem camada de proteção.",
      isWarning: true,
    },
  ],
  modo_normal: [
    {
      description: "Cliente envia requisição GET (A)",
      reqA: "sending", reqB: "idle",
      quotaPercent: 40, mode: "normal",
      redisLines: ["quota: 120/300 req/min (40%)", "mode: NORMAL"],
      sheetsStatus: "aguardando",
    },
    {
      description: "Middleware verifica o contador Redis: 120/300 (40%) → abaixo do gatilho de 50%",
      reqA: "processing", reqB: "idle",
      quotaPercent: 40, mode: "normal",
      redisLines: ["quota: 120/300 req/min (40%)", "mode: NORMAL ✓"],
      sheetsStatus: "aguardando",
    },
    {
      description: "Modo NORMAL ativo → rota direta para Google Sheets via HTTP",
      reqA: "hitting_api", reqB: "idle",
      quotaPercent: 40, mode: "normal",
      redisLines: ["quota: 120/300 req/min (40%)", "mode: NORMAL"],
      sheetsStatus: "200 OK ✓",
    },
    {
      description: "Sheets retorna dado fresco 200 ✓. Redis contador incrementado.",
      reqA: "success", reqB: "idle",
      quotaPercent: 41, mode: "normal",
      redisLines: ["quota: 121/300 req/min (40%)", "mode: NORMAL"],
      sheetsStatus: "200 OK ✓",
      outcome: "✅ Dado fresco da API. Cota em nível seguro (40%), fluxo direto sem overhead.",
    },
  ],
  leitura_degradada: [
    {
      description: "Cliente envia requisição GET (A). Tráfego no pico.",
      reqA: "sending", reqB: "idle",
      quotaPercent: 67, mode: "degraded",
      redisLines: ["quota: 200/300 req/min (67%)", "mode: DEGRADADO", "cache: snapshot OK"],
      sheetsStatus: "aguardando",
    },
    {
      description: "Middleware: quota 200/300 (67%) — acima de 50% → ativa Graceful Degradation",
      reqA: "processing", reqB: "idle",
      quotaPercent: 67, mode: "degraded",
      redisLines: ["quota: 200/300 req/min (67%)", "mode: DEGRADADO ⚠️"],
      sheetsStatus: "protegida",
    },
    {
      description: "Leitura interceptada → busca snapshot no Redis (última cópia válida)",
      reqA: "cache_hit", reqB: "idle",
      quotaPercent: 67, mode: "degraded",
      redisLines: ["quota: 200/300 req/min (67%)", "cache: snapshot + delta buffer", "merge: em andamento"],
      sheetsStatus: "protegida — sem chamada",
    },
    {
      description: "Merge: snapshot + deltas pendentes aplicados em tempo real",
      reqA: "cache_hit", reqB: "idle",
      quotaPercent: 67, mode: "degraded",
      redisLines: ["quota: 200/300 req/min (67%)", "cache: merged OK ✓", "delta_queue: 3 itens aplicados"],
      sheetsStatus: "protegida — sem chamada",
    },
    {
      description: "Resposta 200 com dado atualizado — zero chamadas ao Google Sheets",
      reqA: "success", reqB: "idle",
      quotaPercent: 67, mode: "degraded",
      redisLines: ["quota: 200/300 req/min (67%)", "sheets_calls_saved: +1"],
      sheetsStatus: "protegida — cota preservada ✓",
      outcome: "✅ 0% de erro. Dado atualizado via merge. Cota da API preservada.",
    },
  ],
  escrita_worker: [
    {
      description: "Cliente envia POST de gravação (A). Tráfego crítico.",
      reqA: "sending", reqB: "idle",
      quotaPercent: 83, mode: "degraded",
      redisLines: ["quota: 250/300 req/min (83%)", "mode: DEGRADADO", "delta_queue: 2 itens"],
      sheetsStatus: "protegida",
    },
    {
      description: "Middleware: quota 250/300 (83%) → DEGRADADO. Escrita vai para buffer.",
      reqA: "processing", reqB: "idle",
      quotaPercent: 83, mode: "degraded",
      redisLines: ["quota: 250/300 req/min (83%)", "mode: DEGRADADO ⚠️"],
      sheetsStatus: "protegida — sem chamada",
    },
    {
      description: "Escrita de A bufferizada no Redis delta queue. Sem chamada ao Sheets.",
      reqA: "buffering", reqB: "idle",
      quotaPercent: 83, mode: "degraded",
      redisLines: ["quota: 250/300 req/min (83%)", "delta_queue: 3 itens (incl. A)"],
      sheetsStatus: "protegida — sem chamada",
    },
    {
      description: "Resposta 200 imediata ao cliente. Dado salvo no buffer — consistência eventual.",
      reqA: "success", reqB: "idle",
      quotaPercent: 83, mode: "degraded",
      redisLines: ["quota: 250/300 req/min (83%)", "delta_queue: 3 itens pendentes"],
      sheetsStatus: "protegida",
    },
    {
      description: "Worker (B) monitora cota continuamente. Ainda acima de 150 — aguarda.",
      reqA: "success", reqB: "worker_checking",
      quotaPercent: 83, mode: "degraded",
      redisLines: ["quota: 250/300 (83%) > 150 → aguardando", "delta_queue: 3 itens"],
      sheetsStatus: "aguardando normalização",
    },
    {
      description: "Tráfego cai. Cota normaliza: 130/300 (43%) — abaixo de 50%!",
      reqA: "success", reqB: "worker_checking",
      quotaPercent: 43, mode: "normal",
      redisLines: ["quota: 130/300 req/min (43%) ✓", "mode: NORMAL", "delta_queue: 3 itens → drenar!"],
      sheetsStatus: "disponível",
    },
    {
      description: "Worker drena delta queue → envia gravações cadenciadas para Sheets",
      reqA: "success", reqB: "draining",
      quotaPercent: 43, mode: "normal",
      redisLines: ["quota: 130/300 req/min (43%)", "delta_queue: drenando (3 → 0)"],
      sheetsStatus: "recebendo sincronização ✓",
    },
    {
      description: "Delta queue zerada. Dados sincronizados no Google Sheets.",
      reqA: "success", reqB: "success",
      quotaPercent: 43, mode: "normal",
      redisLines: ["quota: 133/300 req/min (44%)", "delta_queue: 0 itens ✓"],
      sheetsStatus: "200 OK — sincronizado ✓",
      outcome: "✅ 0% de erro. Escrita persistida assincronamente. Cota nunca estourada.",
    },
  ],
};

const STAGES = [
  { label: "Cliente",       icon: "📱" },
  { label: "Laravel",       icon: "⚙️" },
  { label: "Redis",         icon: "🔑" },
  { label: "Google Sheets", icon: "📊" },
  { label: "Resposta",      icon: "💬" },
];

interface PillProps {
  label: string;
  status: ReqStatus;
  scenarioColor: string;
  isWorker?: boolean;
}

function ReqPill({ label, status, scenarioColor, isWorker }: PillProps) {
  const bg =
    status === "error_429"      ? "#EF4444" :
    status === "success"        ? "#10B981" :
    status === "cache_hit"      ? "#3B82F6" :
    status === "buffering"      ? "#F59E0B" :
    status === "worker_checking"? "#8B5CF6" :
    status === "draining"       ? "#8B5CF6" :
    scenarioColor;

  const icon =
    status === "error_429"       ? "✕" :
    status === "success"         ? "✓" :
    status === "cache_hit"       ? "C" :
    status === "buffering"       ? "⏸" :
    status === "worker_checking" ? "W" :
    status === "draining"        ? "↑" :
    status === "hitting_api"     ? "→" :
    label;

  return (
    <div className="relative flex items-center justify-center">
      <div
        className={[
          "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md select-none",
          status === "processing" ? "animate-pulse" : "",
          status === "worker_checking" ? "animate-pulse ring-2 ring-purple-400 ring-offset-1" : "",
          isWorker ? "ring-1 ring-offset-1 ring-white/50" : "",
        ].join(" ")}
        style={{ backgroundColor: bg }}
        title={`${label}: ${status}`}
      >
        {icon}
      </div>
      <span
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-semibold whitespace-nowrap"
        style={{ color: bg }}
      >
        {isWorker ? "worker" : "req"}
      </span>
    </div>
  );
}

function QuotaBar({ percent, mode }: { percent: number; mode: "none" | "normal" | "degraded" }) {
  const barColor =
    mode === "none"     ? "#6B7280" :
    mode === "degraded" ? (percent >= 83 ? "#EF4444" : "#F59E0B") :
    "#10B981";

  const labelColor =
    mode === "none"     ? "text-zinc-500" :
    mode === "degraded" ? "text-amber-600 dark:text-amber-400" :
    "text-emerald-600 dark:text-emerald-400";

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
          Quota Google Sheets
        </span>
        <span className={`text-[9px] font-bold ${labelColor}`}>
          {mode === "none" ? "sem controle" : mode === "degraded" ? "DEGRADADO ⚠️" : "NORMAL ✓"}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, percent)}%`, backgroundColor: barColor }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] text-zinc-400">{mode === "none" ? "?" : `${Math.round(percent * 3)}/300 req/min`}</span>
        <span className="text-[9px] text-zinc-400">
          {mode !== "none" && <span style={{ color: "#F59E0B" }}>▲ 50%</span>}
        </span>
      </div>
    </div>
  );
}

export default function GracefulDegradationAnimation() {
  const [scenario, setScenario] = useState<Scenario>("sem_protecao");
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
    }, 1900);
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
          🎬 Visualização Interativa — Graceful Degradation com Redis
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
        <div
          className="relative grid grid-cols-5 items-center rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden"
          style={{ height: 88 }}
        >
          {/* Dividers */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-dashed border-zinc-200 dark:border-zinc-800 pointer-events-none"
              style={{ left: `${i * 20}%` }}
            />
          ))}
          {/* Arrows */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-700 text-sm pointer-events-none select-none"
              style={{ left: `${i * 20 + 17.5}%` }}
            >
              →
            </div>
          ))}

          {/* Requests per stage */}
          {STAGES.map((_, stageIdx) => {
            const aHere = stageOf(current.reqA) === stageIdx;
            const bHere = stageOf(current.reqB) === stageIdx;
            return (
              <div key={stageIdx} className="flex flex-col items-center justify-center gap-4 h-full">
                {aHere && (
                  <ReqPill label="A" status={current.reqA} scenarioColor={meta.color} />
                )}
                {bHere && (
                  <ReqPill label="B" status={current.reqB} scenarioColor={meta.color} isWorker={scenario === "escrita_worker"} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quota + Sheets status */}
      <div className="px-5 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Quota bar */}
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] px-3 py-2">
          <QuotaBar percent={current.quotaPercent} mode={current.mode} />
        </div>

        {/* Redis state */}
        <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 px-3 py-2">
          <span className="text-xs font-bold text-red-600 dark:text-red-400 shrink-0">🔑</span>
          <div className="min-w-0">
            {current.redisLines.map((line, i) => (
              <p key={i} className="font-mono text-[10px] text-red-700 dark:text-red-300 truncate">{line}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Google Sheets status */}
      <div className="px-5 pt-2">
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-zinc-50 dark:bg-zinc-900">
          <span className="text-[10px] font-bold text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] shrink-0">📊 Sheets API:</span>
          <span
            className="font-mono text-[10px] font-semibold"
            style={{
              color: current.sheetsStatus.includes("429")
                ? "#EF4444"
                : current.sheetsStatus.includes("200") || current.sheetsStatus.includes("✓")
                ? "#10B981"
                : current.sheetsStatus.includes("protegida")
                ? "#3B82F6"
                : "var(--color-muted)",
            }}
          >
            {current.sheetsStatus}
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

      {/* Outcome */}
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

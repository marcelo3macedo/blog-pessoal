"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

export type ChartType = "line" | "bar" | "area" | "pie";

export interface ChartSeries {
  key: string;
  label?: string;
  color?: string;
}

export interface ChartConfig {
  type: ChartType;
  title?: string;
  xKey?: string;
  stacked?: boolean;
  data: Record<string, string | number>[];
  series: ChartSeries[];
}

const ChartRenderer = dynamic(() => import("./ChartRenderer"), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

function ChartSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando gráfico"
      className="my-6 h-80 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] animate-pulse"
    />
  );
}

function parseConfig(raw: string): ChartConfig {
  const parsed = JSON.parse(raw);
  if (!parsed.type || !["line", "bar", "area", "pie"].includes(parsed.type)) {
    throw new Error('campo "type" deve ser "line", "bar", "area" ou "pie"');
  }
  if (!Array.isArray(parsed.data) || parsed.data.length === 0) {
    throw new Error('campo "data" deve ser uma lista não vazia de objetos');
  }
  if (!Array.isArray(parsed.series) || parsed.series.length === 0) {
    throw new Error('campo "series" deve listar ao menos uma chave a ser plotada');
  }
  return parsed as ChartConfig;
}

export default function Chart({ config: raw }: { config: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  const { config, error } = useMemo(() => {
    try {
      return { config: parseConfig(raw), error: null };
    } catch (err) {
      return { config: null, error: err instanceof Error ? err.message : String(err) };
    }
  }, [raw]);

  if (error || !config) {
    return (
      <pre className="my-6 p-4 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-sm text-red-600 dark:text-red-400 overflow-x-auto">
        Erro ao renderizar gráfico: {error}
      </pre>
    );
  }

  return <ChartRenderer config={config} isDark={isDark} />;
}

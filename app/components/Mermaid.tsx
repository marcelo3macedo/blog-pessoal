"use client";

import { useEffect, useId, useState } from "react";

export default function Mermaid({ chart }: { chart: string }) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      const { default: mermaid } = await import("mermaid");
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "neutral",
        fontFamily: "inherit",
      });

      try {
        const { svg } = await mermaid.render(`mermaid-${rawId}`, chart);
        if (!cancelled) setSvg(svg);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart, rawId]);

  if (error) {
    return (
      <pre className="my-6 p-4 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-sm text-red-600 dark:text-red-400 overflow-x-auto">
        Erro ao renderizar diagrama Mermaid: {error}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div
        role="status"
        aria-label="Carregando diagrama"
        className="my-6 h-32 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] animate-pulse"
      />
    );
  }

  return (
    <div
      className="my-6 flex justify-center overflow-x-auto rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-white dark:bg-zinc-950 p-6"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

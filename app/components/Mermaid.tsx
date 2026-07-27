"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

function ExpandIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M8 11h6" />
    </svg>
  );
}

function ZoomResetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function MermaidModal({ svg, onClose }: { svg: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const draggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const contentRef = useRef<HTMLDivElement>(null);

  const zoomTo = (next: number) => {
    const clamped = clampScale(next);
    setScale(clamped);
    if (clamped === MIN_SCALE) setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomTo(scale + (e.deltaY < 0 ? 0.25 : -0.25));
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") zoomTo(scale + 0.5);
      else if (e.key === "-") zoomTo(scale - 0.5);
      else if (e.key === "0") zoomTo(1);
    };
    document.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose, scale]);

  const startDrag = (clientX: number, clientY: number) => {
    if (scale === MIN_SCALE) return;
    draggingRef.current = true;
    setIsDragging(true);
    lastPosRef.current = { x: clientX, y: clientY };
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!draggingRef.current) return;
    const dx = clientX - lastPosRef.current.x;
    const dy = clientY - lastPosRef.current.y;
    lastPosRef.current = { x: clientX, y: clientY };
    setPan((p) => ({ x: p.x + dx / scale, y: p.y + dy / scale }));
  };

  const endDrag = () => {
    draggingRef.current = false;
    setIsDragging(false);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Diagrama ampliado"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
      >
        <CloseIcon />
      </button>

      <div
        className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur px-2 py-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => zoomTo(scale - 0.5)}
          disabled={scale <= MIN_SCALE}
          aria-label="Diminuir zoom"
          title="Diminuir zoom"
          className="p-2 rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
        >
          <ZoomOutIcon />
        </button>
        <span className="min-w-[3.5rem] text-center text-sm text-white tabular-nums select-none">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomTo(scale + 0.5)}
          disabled={scale >= MAX_SCALE}
          aria-label="Aumentar zoom"
          title="Aumentar zoom"
          className="p-2 rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
        >
          <ZoomInIcon />
        </button>
        <span className="w-px h-5 bg-white/20 mx-1" />
        <button
          type="button"
          onClick={() => zoomTo(1)}
          disabled={scale === MIN_SCALE}
          aria-label="Restaurar zoom"
          title="Restaurar zoom"
          className="p-2 rounded-full text-white hover:bg-white/20 transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-default"
        >
          <ZoomResetIcon />
        </button>
      </div>

      <div
        ref={contentRef}
        className="w-full h-full overflow-hidden rounded-xl bg-white dark:bg-zinc-950 p-6 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={endDrag}
        onDoubleClick={() => zoomTo(scale === MIN_SCALE ? 2 : 1)}
        style={{ cursor: scale > MIN_SCALE ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
        <div
          className="mermaid-diagram mermaid-diagram-expanded w-full h-full flex items-center justify-center"
          style={{
            transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>,
    document.body
  );
}

export default function Mermaid({ chart }: { chart: string }) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

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
    <>
      <div className="group relative my-6">
        <div
          className="mermaid-diagram flex justify-center overflow-x-auto rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-white dark:bg-zinc-950 p-6 cursor-zoom-in"
          onClick={() => setExpanded(true)}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Ampliar diagrama"
          title="Ampliar diagrama"
          className="absolute top-3 right-3 p-2 rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-white/90 dark:bg-zinc-900/90 text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-zoom-in"
        >
          <ExpandIcon />
        </button>
      </div>
      {expanded && <MermaidModal svg={svg} onClose={() => setExpanded(false)} />}
    </>
  );
}

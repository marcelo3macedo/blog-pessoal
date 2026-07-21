"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "cookie-consent";
export const CONSENT_EVENT = "cookie-consent-changed";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
  }, []);

  function respond(value: "accepted" | "declined") {
    localStorage.setItem(CONSENT_KEY, value);
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/50"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-cream)] dark:bg-zinc-950 p-6 shadow-xl">
        <h2
          id="cookie-consent-title"
          className="font-display text-lg font-bold text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-2"
        >
          Cookies e Analytics
        </h2>
        <p className="text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] leading-relaxed mb-5">
          Usamos o Google Analytics para entender como este blog é usado. Nenhum dado pessoal é coletado.{" "}
          <Link
            href="/privacidade"
            prefetch={false}
            className="underline underline-offset-2 text-[var(--color-brand)] dark:text-[var(--color-brand-dark)] hover:opacity-75 transition-opacity"
          >
            Saiba mais
          </Link>
          .
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => respond("declined")}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] hover:border-[var(--color-ink)] dark:hover:border-[var(--color-ink-dark)] transition-colors"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => respond("accepted")}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-brand)] dark:bg-[var(--color-brand-dark)] text-white hover:opacity-90 transition-opacity"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}

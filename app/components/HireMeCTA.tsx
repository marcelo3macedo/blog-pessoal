const COPY = {
  pt: {
    headline: "Precisa de suporte técnico para arquitetar sistemas resilientes e escaláveis?",
    bio: "Sou Marcelo Alberico Macedo, Engenheiro de Software Sênior e Arquiteto. Possuo MBA pela USP/Esalq e atuo desenhando ecossistemas de microsserviços, mensageria e alta disponibilidade para plataformas enterprise.",
    linkedin: "Conecte-se comigo no LinkedIn",
    github: "Explore mais projetos no meu GitHub",
    schedule: "Agende uma conversa sobre Consultoria ou Projetos de Arquitetura",
  },
  en: {
    headline: "Need technical support to architect resilient, scalable systems?",
    bio: "I'm Marcelo Alberico Macedo, Senior Software Engineer and Architect. I hold an MBA from USP/Esalq and design microservices ecosystems, messaging, and high-availability platforms for enterprise-grade products.",
    linkedin: "Connect with me on LinkedIn",
    github: "Explore more projects on my GitHub",
    schedule: "Schedule a conversation about Consulting or Architecture Projects",
  },
} as const;

interface Props {
  locale: "pt" | "en";
}

export default function HireMeCTA({ locale }: Props) {
  const t = COPY[locale];

  return (
    <section className="mt-16 pt-10 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
      <div className="rounded-2xl border border-[var(--color-brand)]/30 dark:border-[var(--color-brand-dark)]/30 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-6 sm:p-8">
        <p className="font-display text-lg font-bold text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-3">
          💡 {t.headline}
        </p>
        <p className="text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] leading-relaxed mb-5">
          {t.bio}
        </p>
        <ul className="space-y-2.5 text-sm">
          <li>
            <a
              href="https://www.linkedin.com/in/marceloamacedo/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] hover:text-[var(--color-brand)] dark:hover:text-[var(--color-brand-dark)] hover:underline underline-offset-4 transition-colors"
            >
              🔗 {t.linkedin}
            </a>
          </li>
          <li>
            <a
              href="https://github.com/marcelo3macedo"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] hover:text-[var(--color-brand)] dark:hover:text-[var(--color-brand-dark)] hover:underline underline-offset-4 transition-colors"
            >
              🛠️ {t.github}
            </a>
          </li>
          <li>
            <a
              href="mailto:marcelo3macedo@gmail.com"
              className="font-medium text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] hover:text-[var(--color-brand)] dark:hover:text-[var(--color-brand-dark)] hover:underline underline-offset-4 transition-colors"
            >
              📧 {t.schedule}
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}

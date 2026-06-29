import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/seo";

const TITLE = "Perfil Profissional";
const DESCRIPTION = "Currículo profissional de Marcelo Alberico Macedo. Desenvolvedor Full-Stack, especializado em Node.js, TypeScript e arquitetura de sistemas.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/perfil` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/perfil`, type: "profile" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

export default function PerfilPage() {
  return (
    <div className="mx-auto">
      {/* Header Profile Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pb-10 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[var(--color-brand)] to-[#4f46e5] dark:from-[var(--color-brand-dark)] dark:to-[#818cf8] flex items-center justify-center flex-shrink-0 shadow-md">
            <img src="/uplaods/perfil.jpeg" alt="Profile" className="w-20 h-20 rounded-2xl" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] tracking-tight">
              Marcelo Alberico Macedo
            </h1>
            <p className="text-sm font-medium text-[var(--color-brand)] dark:text-[var(--color-brand-dark)] mt-1 uppercase tracking-wider">
              Desenvolvedor Full-Stack
            </p>
          </div>
        </div>
      </div>

      {/* Resumo Profissional */}
      <section className="mb-12">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mb-4">
          Sobre Mim
        </h2>
        <div className="space-y-4 text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] leading-relaxed">
          <p>Engenheiro de Software com mais de 15 anos de experiência projetando e desenvolvendo sistemas escaláveis para e-commerce, BI, plataformas SaaS e soluções omnichannel. Ao longo da carreira, participei da construção de aplicações utilizadas por milhares de usuários, incluindo operações de alta disponibilidade e ambientes com grande volume de transações.</p>
          <p>Atuo principalmente com TypeScript, Node.js, NestJS, React e Next.js, com sólida experiência em microsserviços, arquitetura orientada a eventos, mensageria assíncrona, modelagem de dados e integração de sistemas.</p>
          <p>Tenho perfil hands-on e visão de produto, participando desde a definição dos requisitos e arquitetura até a entrega, observabilidade e evolução das soluções em produção.</p>
          <p>Também utilizo inteligência artificial no dia a dia para acelerar desenvolvimento, testes, revisão de código e automação de processos, acompanhando continuamente a evolução de LLMs, agentes de IA e ferramentas modernas de engenharia de software.</p>
          <p>MBA em Engenharia de Software pela USP/Esalq, Pós-graduação em Desenvolvimento Web pela UFSCar e Inglês C1 (EF SET).</p>
        </div>

        {/* Links Rápidos */}
        <div className="flex flex-wrap gap-3 mt-6">
          <a
            href="https://www.linkedin.com/in/marcelo-alberico-macedo-23639630/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A66C2] text-white text-xs font-semibold hover:bg-[#085196] shadow-sm hover:shadow transition-all hover:-translate-y-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </a>
          <a
            href="https://github.com/marcelo3macedo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#24292e] text-white text-xs font-semibold hover:bg-[#1a1e22] shadow-sm hover:shadow transition-all hover:-translate-y-0.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
            GitHub
          </a>
        </div>
      </section>

      {/* Projetos em Destaque */}
      <section className="mb-12">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mb-5">
          Projetos em Destaque
        </h2>
        <a
          href="https://github.com/marcelo3macedo/water-drink"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-1 block"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-[var(--color-brand)]/10 text-[var(--color-brand)] dark:text-[var(--color-brand-dark)] px-2.5 py-1 rounded-md mb-2">
                Mobile · Open Source
              </span>
              <h3 className="font-display text-lg font-bold text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">
                Hidratação Diária — Water Drink
              </h3>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1 text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] group-hover:text-[var(--color-brand)] dark:group-hover:text-[var(--color-brand-dark)] transition-colors" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </div>
          <p className="text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] leading-relaxed mb-4">
            Aplicativo mobile desenvolvido em React Native com Expo para registrar e acompanhar a ingestão de água ao longo do dia. Conta com indicador circular de progresso, botões de ação rápida, meta diária personalizável, notificações inteligentes e histórico de registros.
          </p>
          <div className="flex flex-wrap gap-2">
            {["React Native", "Expo", "React Navigation", "AsyncStorage", "JavaScript"].map((tech) => (
              <span key={tech} className="text-xs bg-[var(--color-cream)] dark:bg-[var(--color-cream-dark)] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] px-2.5 py-1 rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                {tech}
              </span>
            ))}
          </div>
        </a>
      </section>

      {/* Experiência Profissional */}
      <section className="mb-12">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mb-6">
          Experiência Profissional
        </h2>
        <div className="relative border-l border-[var(--color-border)] dark:border-[var(--color-border-dark)] pl-6 space-y-8 ml-3">
          {/* Job 1 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[var(--color-brand)] dark:border-[var(--color-brand-dark)] bg-[var(--color-cream)] dark:bg-[var(--color-cream-dark)]" />
            <div>
              <h3 className="font-bold text-sm text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">
                Desenvolvedor de Software Sênior
              </h3>
              <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mb-2.5">
                Dealerspace - 2025 - 2026
              </p>
              <ul className="text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] list-disc pl-4 space-y-1.5">
                <li>Desenvolvimento de arquitetura de microsserviços e plataforma de comunicação omnichannel com TypeScript.</li>
                <li>Implementação de automações de atendimento e integrações com APIs externas, incluindo recursos de inteligência artificial e agentes conversacionais para interação e automação de tarefas.</li>
                <li>Configuração e otimização de ambiente AWS. Aplicação de testes unitários, refatoração contínua e garantia da qualidade do código.</li>
              </ul>
            </div>
          </div>

          {/* Job 2 */}
          <div className="relative">
            <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-cream)] dark:bg-[var(--color-cream-dark)]" />
            <div>
              <h3 className="font-bold text-sm text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">
                Desenvolvedor de Sistemas Sênior
              </h3>
              <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mb-2.5">
                New Way - 2020 — 2025
              </p>
              <ul className="text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] list-disc pl-4 space-y-1.5">
                <li>Garantia de alta disponibilidade em plataforma de chatbot, elevando a taxa de entrega de mensagens de 97% para 99,99%.</li>
                <li>Otimização da infraestrutura AWS, reduzindo custos operacionais e aumentando a eficiência dos recursos em nuvem.</li>
                <li>Implementação de melhorias e novas funcionalidades para dinamizar o atendimento ao cliente e aprimorar a experiência do usuário.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Formação Acadêmica */}
      <section className="mb-12">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mb-5">
          Formação Acadêmica
        </h2>
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]">
            <h3 className="font-bold text-sm text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">
              MBA em Engenharia de Software
            </h3>
            <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mt-0.5">
              USP / Esalq (Universidade de São Paulo)
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]">
            <h3 className="font-bold text-sm text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">
              Especialização em Desenvolvimento de Software para Web
            </h3>
            <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mt-0.5">
              UFSCar (Universidade Federal de São Carlos)
            </p>
          </div>
        </div>
      </section>

      {/* Certificações */}
      <section className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mb-5">
          Certificações
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex items-start gap-3 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0 font-mono">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-xs text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] leading-tight">
                AWS Foundations
              </h3>
              <p className="text-[10px] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mt-0.5">
                Pluralsight
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex items-start gap-3 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0 font-mono">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-xs text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] leading-tight">
                AI Agents
              </h3>
              <p className="text-[10px] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mt-0.5">
                Hugging Face
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex items-start gap-3 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0 font-mono">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-xs text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] leading-tight">
                Expert Node.js Microservices
              </h3>
              <p className="text-[10px] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mt-0.5">
                Pluralsight
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex items-start gap-3 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center flex-shrink-0 font-mono">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-xs text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] leading-tight">
                Certificado oficial EF SET 66/100 (C1 Advanced)
              </h3>
              <p className="text-[10px] text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mt-0.5">
                EF SET
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Voltar para Home Link */}
      <div className="flex justify-start border-t border-[var(--color-border)] pt-8 mt-8 dark:border-[var(--color-border-dark)]">
        <Link
          href="/"
          prefetch={false}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-sm font-medium text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] hover:text-[var(--color-ink)] dark:hover:text-[var(--color-ink-dark)] hover:border-[var(--color-ink)] dark:hover:border-[var(--color-ink-dark)] transition-colors"
        >
          ← Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}

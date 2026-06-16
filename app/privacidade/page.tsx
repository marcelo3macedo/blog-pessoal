import type { Metadata } from "next";
import { SITE_URL } from "@/lib/seo";

const TITLE = "Política de Privacidade";
const DESCRIPTION = "Como este blog usa cookies e o Google Analytics.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/privacidade` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/privacidade`, type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

const UPDATED = "15 de junho de 2026";

export default function PrivacidadePage() {
  return (
    <div className="max-w-xl">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-2">
          Política de Privacidade
        </h1>
        <p className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
          Última atualização: {UPDATED}
        </p>
      </div>

      <div className="space-y-8 text-sm text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] leading-relaxed">

        <section>
          <h2 className="font-semibold text-base text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-2">
            1. Visão geral
          </h2>
          <p>
            O <strong className="text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">além do script</strong> é
            um blog pessoal. Não coletamos dados de cadastro, não temos área de login e não vendemos informações a
            terceiros. O único serviço externo ativo neste site é o Google Analytics, utilizado exclusivamente para
            entender quais conteúdos têm mais interesse.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-2">
            2. Google Analytics e cookies
          </h2>
          <p className="mb-3">
            Utilizamos o <strong className="text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">Google Analytics 4</strong> para
            coletar estatísticas anônimas de acesso. Quando você visita o blog, o Google Analytics armazena os
            seguintes cookies no seu navegador:
          </p>

          <div className="rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] overflow-hidden mb-3">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface)] dark:bg-zinc-900/80 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">Cookie</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">Finalidade</th>
                  <th className="px-4 py-3 text-left font-semibold text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">Duração</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] dark:divide-[var(--color-border-dark)]">
                <tr className="even:bg-[var(--color-cream)] dark:even:bg-zinc-950/40">
                  <td className="px-4 py-3 font-mono text-[var(--color-brand)] dark:text-[var(--color-brand-dark)]">_ga</td>
                  <td className="px-4 py-3">Identifica visitantes únicos de forma anônima</td>
                  <td className="px-4 py-3 whitespace-nowrap">2 anos</td>
                </tr>
                <tr className="even:bg-[var(--color-cream)] dark:even:bg-zinc-950/40">
                  <td className="px-4 py-3 font-mono text-[var(--color-brand)] dark:text-[var(--color-brand-dark)]">_ga_*</td>
                  <td className="px-4 py-3">Mantém o estado da sessão de análise (GA4)</td>
                  <td className="px-4 py-3 whitespace-nowrap">2 anos</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            Nenhum dado pessoal identificável (nome, e-mail, IP completo) é armazenado pelo Google Analytics nesta
            configuração. Os dados são agregados e usados apenas para métricas como número de visitas, páginas mais
            acessadas e origem do tráfego.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-2">
            3. Como recusar ou remover os cookies
          </h2>
          <p className="mb-3">Você tem total controle sobre os cookies. As opções disponíveis são:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">Configurações do navegador</strong> — todos os navegadores modernos permitem bloquear ou excluir cookies em Configurações → Privacidade.
            </li>
            <li>
              <strong className="text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">Extensão oficial do Google</strong> — instale o{" "}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-brand)] dark:text-[var(--color-brand-dark)] underline underline-offset-2 hover:opacity-75 transition-opacity"
              >
                Google Analytics Opt-out Add-on
              </a>{" "}
              para bloquear o rastreamento em qualquer site que use o Analytics.
            </li>
            <li>
              <strong className="text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">Modo privado / anônimo</strong> — navegadores em modo anônimo não persistem cookies entre sessões.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-base text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-2">
            4. Links externos
          </h2>
          <p>
            Alguns posts podem conter links para sites de terceiros. Esta política não se aplica a esses sites — cada
            um tem seus próprios termos e política de privacidade.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-base text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-2">
            5. Contato
          </h2>
          <p>
            Dúvidas sobre esta política? Entre em contato pelo{" "}
            <a
              href="https://www.linkedin.com/in/marcelo-alberico-macedo-23639630/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-brand)] dark:text-[var(--color-brand-dark)] underline underline-offset-2 hover:opacity-75 transition-opacity"
            >
              LinkedIn
            </a>
            .
          </p>
        </section>

      </div>
    </div>
  );
}

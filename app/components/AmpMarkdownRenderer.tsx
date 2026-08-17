import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";
import { createSlugger } from "@/lib/toc";

const IMAGES_BASE_URL = (process.env.IMAGES_BASE_URL ?? "").replace(/\/$/, "");

function resolveSrc(src?: string | Blob): string {
  if (!src || typeof src !== "string") return "";
  if (/^https?:\/\//.test(src) || src.startsWith("//") || src.startsWith("/")) return src;
  const clean = src.replace(/^\.\//, "");
  return IMAGES_BASE_URL ? `${IMAGES_BASE_URL}/${clean}` : `/${clean}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasImageNode(node: any): boolean {
  if (!node) return false;
  if (node.type === "element" && node.tagName === "img") return true;
  if (node.children && Array.isArray(node.children)) {
    return node.children.some(hasImageNode);
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isTaskChecked(node: any): boolean {
  if (!node) return false;
  if (node.type === "element" && node.tagName === "input") {
    return Boolean(node.properties?.checked);
  }
  if (node.children && Array.isArray(node.children)) {
    return node.children.some(isTaskChecked);
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNodeText(node: any): string {
  if (!node) return "";
  if (node.type === "text") return node.value ?? "";
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(getNodeText).join("");
  }
  return "";
}

// Chart code blocks store a JSON ChartConfig; AMP has no recharts equivalent,
// so we only lift the (optional) title for the fallback note.
function extractChartTitle(raw: string): string | null {
  try {
    const config = JSON.parse(raw) as { title?: string };
    return config.title ?? null;
  } catch {
    return null;
  }
}

function createComponents(canonicalUrl: string, locale: "pt" | "en"): Components {
  const slugger = createSlugger();

  return {
    h1: ({ children, node }) => <h1 id={slugger(getNodeText(node))}>{children}</h1>,
    h2: ({ children, node }) => <h2 id={slugger(getNodeText(node))}>{children}</h2>,
    h3: ({ children, node }) => <h3 id={slugger(getNodeText(node))}>{children}</h3>,
    h4: ({ children }) => <h4>{children}</h4>,

    // <figure>/<amp-img> aren't valid inside <p>; fall back to a <div> when
    // the paragraph wraps an image, same as MarkdownRenderer.
    p: ({ children, node }) => {
      if (hasImageNode(node)) return <div>{children}</div>;
      return <p>{children}</p>;
    },

    a: ({ href, children }) => (
      <a
        href={href}
        target={/^https?:\/\//.test(href ?? "") ? "_blank" : undefined}
        rel={/^https?:\/\//.test(href ?? "") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),

    img: ({ src, alt }) => (
      <figure>
        <amp-img src={resolveSrc(src)} alt={alt ?? ""} layout="fixed-height" height="400" />
        {alt && <figcaption>{alt}</figcaption>}
      </figure>
    ),

    pre: ({ children, node }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const codeNode = (node as any)?.children?.[0];
      const classes: string[] = codeNode?.properties?.className ?? [];
      const lang = classes
        .find((c: string) => c.startsWith("language-"))
        ?.replace("language-", "");
      const raw = getNodeText(codeNode).replace(/\n$/, "");

      // AMP forbids custom JavaScript, so neither Mermaid nor recharts can
      // render here — point back to the full article instead.
      if (lang === "mermaid") {
        return (
          <p className="amp-embed-note">
            {locale === "en"
              ? "This is an interactive diagram, available only in the "
              : "Este é um diagrama interativo, disponível apenas na "}
            <a href={canonicalUrl}>
              {locale === "en" ? "full version of the article" : "versão completa do artigo"}
            </a>
            .
          </p>
        );
      }

      if (lang === "chart") {
        const title = extractChartTitle(raw);
        return (
          <p className="amp-embed-note">
            {locale === "en"
              ? title
                ? `“${title}” is an interactive chart, available only in the `
                : "This is an interactive chart, available only in the "
              : title
                ? `“${title}” é um gráfico interativo, disponível apenas na `
                : "Este é um gráfico interativo, disponível apenas na "}
            <a href={canonicalUrl}>
              {locale === "en" ? "full version of the article" : "versão completa do artigo"}
            </a>
            .
          </p>
        );
      }

      return (
        <div className="amp-code-wrap">
          {lang && <span className="amp-code-lang">{lang}</span>}
          <pre>{children}</pre>
        </div>
      );
    },

    code: ({ children, className }) => {
      if (className?.includes("language-")) {
        return <code className={className}>{children}</code>;
      }
      return <code>{children}</code>;
    },

    blockquote: ({ children }) => <blockquote>{children}</blockquote>,

    table: ({ children }) => (
      <div className="amp-table-wrap">
        <table>{children}</table>
      </div>
    ),

    li: ({ children, className, node }) => {
      if (className === "task-list-item") {
        return (
          <li className="amp-task">
            <span className="amp-task-mark" aria-hidden="true">
              {isTaskChecked(node) ? "☑" : "☐"}
            </span>
            {children}
          </li>
        );
      }
      return <li>{children}</li>;
    },

    // Task-list checkboxes render as a raw <input>, which AMP HTML disallows
    // outside of amp-form; the ☐ marker above already conveys the state.
    input: () => null,

    hr: () => <hr />,
  };
}

export default function AmpMarkdownRenderer({
  content,
  canonicalUrl,
  locale = "pt",
}: {
  content: string;
  canonicalUrl: string;
  locale?: "pt" | "en";
}) {
  return (
    <div className="amp-article">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={createComponents(canonicalUrl, locale)}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";

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

const md: Components = {
  /* ── Headings ─────────────────────────────────────────────────────── */
  h1: ({ children }) => (
    <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mt-10 mb-4 leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mt-9 mb-3">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-semibold text-lg text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mt-7 mb-2">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="font-semibold text-sm uppercase tracking-widest text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] mt-6 mb-1.5">
      {children}
    </h4>
  ),

  /* ── Paragraph ────────────────────────────────────────────────────── */
  p: ({ children, node }) => {
    if (hasImageNode(node)) {
      return (
        <div className="text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] leading-[1.85] mb-5">
          {children}
        </div>
      );
    }
    return (
      <p className="text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] leading-[1.85] mb-5">
        {children}
      </p>
    );
  },

  /* ── Inline formatting ────────────────────────────────────────────── */
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">
      {children}
    </strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  del: ({ children }) => <del className="line-through opacity-60">{children}</del>,

  /* ── Links ────────────────────────────────────────────────────────── */
  a: ({ href, children }) => (
    <a
      href={href}
      target={/^https?:\/\//.test(href ?? "") ? "_blank" : undefined}
      rel={/^https?:\/\//.test(href ?? "") ? "noopener noreferrer" : undefined}
      className="text-[var(--color-brand)] dark:text-[var(--color-brand-dark)] underline underline-offset-2 hover:opacity-75 transition-opacity"
    >
      {children}
    </a>
  ),

  /* ── Images ───────────────────────────────────────────────────────── */
  img: ({ src, alt }) => (
    <figure className="my-8 flex flex-col items-center">
      <img
        src={resolveSrc(src)}
        alt={alt ?? ""}
        loading="lazy"
        className="rounded-xl max-w-full h-auto border border-[var(--color-border)] dark:border-[var(--color-border-dark)]"
      />
      {alt && (
        <figcaption className="mt-2 text-center text-xs italic text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
          {alt}
        </figcaption>
      )}
    </figure>
  ),

  /* ── Code blocks ──────────────────────────────────────────────────── */
  pre: ({ children, node }) => {
    // Extract language from the HAST node before rehype-highlight mutates classes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const codeNode = (node as any)?.children?.[0];
    const classes: string[] = codeNode?.properties?.className ?? [];
    const lang = classes
      .find((c: string) => c.startsWith("language-"))
      ?.replace("language-", "");

    return (
      <div className="my-6 rounded-xl overflow-hidden border border-zinc-800">
        {lang && (
          <div className="flex items-center px-4 py-2 bg-[#141414] border-b border-zinc-800">
            <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              {lang}
            </span>
          </div>
        )}
        <pre className="overflow-x-auto p-5 bg-[#1a1a1a] text-sm leading-relaxed m-0 rounded-none">
          {children}
        </pre>
      </div>
    );
  },

  /* ── Inline code ──────────────────────────────────────────────────── */
  code: ({ children, className }) => {
    if (className?.includes("language-")) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="font-mono text-[0.875em] bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 px-1.5 py-0.5 rounded-md border border-violet-100 dark:border-violet-900/50">
        {children}
      </code>
    );
  },

  /* ── Blockquote ───────────────────────────────────────────────────── */
  blockquote: ({ children }) => (
    <blockquote className="my-6 pl-5 border-l-[3px] border-[var(--color-brand)] dark:border-[var(--color-brand-dark)] italic text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] [&>p]:mb-0">
      {children}
    </blockquote>
  ),

  /* ── Table ────────────────────────────────────────────────────────── */
  table: ({ children }) => (
    <div className="my-7 w-full overflow-x-auto rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[var(--color-surface)] dark:bg-zinc-900/80">{children}</thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-[var(--color-border)] dark:divide-[var(--color-border-dark)]">{children}</tbody>,
  tr: ({ children }) => (
    <tr className="even:bg-[var(--color-cream)] dark:even:bg-zinc-950/40 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
      {children}
    </td>
  ),

  /* ── Lists ────────────────────────────────────────────────────────── */
  ul: ({ children, className }) => {
    const isTask = className === "contains-task-list";
    return (
      <ul
        className={`my-4 space-y-2 text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] ${
          isTask ? "list-none pl-0" : "list-disc pl-5"
        }`}
      >
        {children}
      </ul>
    );
  },
  ol: ({ children }) => (
    <ol className="my-4 space-y-2 list-decimal pl-5 text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
      {children}
    </ol>
  ),
  li: ({ children, className }) => {
    const isTask = className === "task-list-item";
    return (
      <li className={`leading-relaxed ${isTask ? "flex items-start gap-2.5 list-none" : ""}`}>
        {children}
      </li>
    );
  },

  /* ── Checkbox (checklist) ─────────────────────────────────────────── */
  input: ({ type, checked, ...props }) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={checked ?? false}
          readOnly
          className="mt-[3px] h-[15px] w-[15px] flex-shrink-0 cursor-default rounded accent-[var(--color-brand)]"
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      );
    }
    return <input type={type} {...(props as React.InputHTMLAttributes<HTMLInputElement>)} />;
  },

  /* ── Horizontal rule ──────────────────────────────────────────────── */
  hr: () => (
    <hr className="my-10 border-none h-px bg-[var(--color-border)] dark:bg-[var(--color-border-dark)]" />
  ),
};

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="min-w-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={md}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

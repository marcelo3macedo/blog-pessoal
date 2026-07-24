export interface Heading {
  id: string;
  text: string;
  level: number;
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Shared between the server-side markdown scan (extractHeadings) and
// MarkdownRenderer's heading components, so both assign identical ids
// as long as headings are visited in the same document order.
export function createSlugger() {
  const counts = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text) || "secao";
    const n = counts.get(base) ?? 0;
    counts.set(base, n + 1);
    return n === 0 ? base : `${base}-${n + 1}`;
  };
}

function stripMarkdownInline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

const HEADING_RE = /^(#{1,3})\s+(.+?)\s*$/;

export function extractHeadings(markdown: string): Heading[] {
  const slugger = createSlugger();
  const headings: Heading[] = [];
  let inCodeBlock = false;

  for (const line of markdown.split("\n")) {
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = HEADING_RE.exec(line);
    if (!match) continue;

    const text = stripMarkdownInline(match[2]);
    if (!text) continue;

    headings.push({ id: slugger(text), text, level: match[1].length });
  }

  return headings;
}

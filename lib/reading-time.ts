const WORDS_PER_MINUTE = 200;

// Estimates reading time in minutes from the word count of the raw markdown content.
export function estimateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

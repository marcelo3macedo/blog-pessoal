export const CATEGORY_STYLES: Record<
  string,
  { pill: string; heading: string; border: string; dot: string }
> = {
  tecnologia: {
    pill: "bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:ring-sky-800",
    heading: "text-sky-600 dark:text-sky-400",
    border: "border-sky-300 dark:border-sky-700",
    dot: "bg-sky-500",
  },
  "desenvolvimento-web": {
    pill: "bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:ring-violet-800",
    heading: "text-violet-600 dark:text-violet-400",
    border: "border-violet-300 dark:border-violet-700",
    dot: "bg-violet-500",
  },
  "vida-pessoal": {
    pill: "bg-rose-100 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:ring-rose-800",
    heading: "text-rose-600 dark:text-rose-400",
    border: "border-rose-300 dark:border-rose-700",
    dot: "bg-rose-500",
  },
  produtividade: {
    pill: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-800",
    heading: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-300 dark:border-emerald-700",
    dot: "bg-emerald-500",
  },
};

export const TAG_COLORS: Record<string, string> = {
  amber:   "bg-amber-100   text-amber-700   ring-1 ring-amber-200   dark:bg-amber-950/60   dark:text-amber-300   dark:ring-amber-800",
  teal:    "bg-teal-100    text-teal-700    ring-1 ring-teal-200    dark:bg-teal-950/60    dark:text-teal-300    dark:ring-teal-800",
  orange:  "bg-orange-100  text-orange-700  ring-1 ring-orange-200  dark:bg-orange-950/60  dark:text-orange-300  dark:ring-orange-800",
  cyan:    "bg-cyan-100    text-cyan-700    ring-1 ring-cyan-200    dark:bg-cyan-950/60    dark:text-cyan-300    dark:ring-cyan-800",
  lime:    "bg-lime-100    text-lime-700    ring-1 ring-lime-200    dark:bg-lime-950/60    dark:text-lime-300    dark:ring-lime-800",
  pink:    "bg-pink-100    text-pink-700    ring-1 ring-pink-200    dark:bg-pink-950/60    dark:text-pink-300    dark:ring-pink-800",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700 ring-1 ring-fuchsia-200 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 dark:ring-fuchsia-800",
  indigo:  "bg-indigo-100  text-indigo-700  ring-1 ring-indigo-200  dark:bg-indigo-950/60  dark:text-indigo-300  dark:ring-indigo-800",
};

export function getCategoryStyle(slug: string) {
  return CATEGORY_STYLES[slug] ?? CATEGORY_STYLES["tecnologia"];
}

export function getTagColorClass(color: string) {
  return TAG_COLORS[color] ?? TAG_COLORS["indigo"];
}

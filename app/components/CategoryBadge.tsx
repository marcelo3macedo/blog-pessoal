import Link from "next/link";
import { getCategoryStyle } from "@/lib/colors";

interface Props {
  name: string;
  slug: string;
  asLink?: boolean;
}

export default function CategoryBadge({ name, slug, asLink = true }: Props) {
  const style = getCategoryStyle(slug);
  const cls = `inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${style.pill}`;

  if (!asLink) return <span className={cls}>{name}</span>;

  return (
    <Link href={`/categorias/${slug}`} className={cls}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {name}
    </Link>
  );
}

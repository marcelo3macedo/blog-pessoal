import { getTagColorClass } from "@/lib/colors";
import type { Tag } from "@/lib/db";

export default function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md ${getTagColorClass(tag.color)}`}
    >
      {tag.name}
    </span>
  );
}

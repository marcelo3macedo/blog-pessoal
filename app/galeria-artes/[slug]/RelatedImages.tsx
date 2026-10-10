interface CivitaiImage {
  id: number;
  url: string;
  width: number;
  height: number;
  meta?: {
    prompt?: string;
    Model?: string;
  };
  stats?: {
    heartCount: number;
    likeCount: number;
  };
}

async function fetchCivitaiImages(): Promise<CivitaiImage[]> {
  try {
    const res = await fetch(
      "https://civitai.com/api/v1/images?limit=8&nsfw=false&sort=Most+Reactions&period=Week",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []) as CivitaiImage[];
  } catch {
    return [];
  }
}

export default async function RelatedImages() {
  const images = await fetchCivitaiImages();

  if (images.length === 0) return null;

  return (
    <div className="mt-16 pt-10 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-[var(--color-ink)] dark:text-[var(--color-ink-dark)]">
          Em alta no Civitai
        </h2>
        <a
          href="https://civitai.com/images"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--color-brand)] dark:text-[var(--color-brand-dark)] hover:underline"
        >
          Ver mais →
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {images.slice(0, 8).map((img) => (
          <a
            key={img.id}
            href={`https://civitai.com/images/${img.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block relative overflow-hidden rounded-lg aspect-square bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]"
          >
            <img
              src={`${img.url}/width=400`}
              alt={img.meta?.prompt?.slice(0, 60) ?? "Civitai image"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {img.stats && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-white font-medium">
                  ❤ {img.stats.heartCount + img.stats.likeCount}
                </span>
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

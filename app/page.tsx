import type { Metadata } from "next";
import { getRecentPosts } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import PostCard from "./components/PostCard";

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

export default function HomePage() {
  const posts = getRecentPosts(10);

  return (
    <div>
      <div className="mb-12">
        <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-3">
          Últimos posts
        </h1>
        <p className="text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
          Reflexões sobre tecnologia, desenvolvimento web e vida.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-[var(--color-muted)]">Nenhum post publicado ainda.</p>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

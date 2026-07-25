import type { Metadata } from "next";
import { getFeaturedPosts, getRecentPosts } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";
import PostCard from "../components/PostCard";

export const metadata: Metadata = {
  title: "Latest posts",
  alternates: { canonical: `${SITE_URL}/en` },
};

export default function EnglishHomePage() {
  const featuredPosts = getFeaturedPosts(10, undefined, "en");
  const posts = getRecentPosts(10, undefined, "en");

  return (
    <div>
      {featuredPosts.length > 0 && (
        <div className="mb-16">
          <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-6">
            Featured
          </h2>
          <div>
            {featuredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      <div className="mb-12">
        <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--color-ink)] dark:text-[var(--color-ink-dark)] mb-3">
          Latest posts
        </h1>
        <p className="text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
          Thoughts on technology, web development and software engineering.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-[var(--color-muted)]">No posts published yet.</p>
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

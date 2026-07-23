import type { MetadataRoute } from "next";
import { getAllCategories, getProjectGroups, getRecentPosts } from "@/lib/db";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getRecentPosts(1000, undefined, "pt");
  const postsEn = getRecentPosts(1000, undefined, "en");
  const categories = getAllCategories();
  const projects = getProjectGroups("projetos");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/en`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/projetos`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/categorias`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/sobre`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/perfil`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacidade`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: new Date(post.published_at),
    changeFrequency: "monthly",
    priority: 0.8,
    ...(post.translation_slug
      ? { alternates: { languages: { en: `${SITE_URL}/posts/en/${post.translation_slug}` } } }
      : {}),
  }));

  const postEnRoutes: MetadataRoute.Sitemap = postsEn.map((post) => ({
    url: `${SITE_URL}/posts/en/${post.slug}`,
    lastModified: new Date(post.published_at),
    changeFrequency: "monthly",
    priority: 0.8,
    ...(post.translation_slug
      ? { alternates: { languages: { "pt-BR": `${SITE_URL}/posts/${post.translation_slug}` } } }
      : {}),
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/categorias/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${SITE_URL}/projetos/${project.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...postRoutes, ...postEnRoutes, ...categoryRoutes, ...projectRoutes];
}

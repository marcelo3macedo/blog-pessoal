import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.civitai.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  outputFileTracingIncludes: {
    '/**': ['./node_modules/@swc/helpers/**'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
    inlineCss: true,
  },
  async rewrites() {
    return [
      { source: "/amp/posts/en/:slug", destination: "/api/amp/posts/en/:slug" },
      { source: "/amp/posts/:slug", destination: "/api/amp/posts/:slug" },
    ];
  },
};
export default nextConfig;
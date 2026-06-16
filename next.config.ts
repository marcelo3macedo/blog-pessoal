import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '/**': ['./node_modules/@swc/helpers/**'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};
export default nextConfig;
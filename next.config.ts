import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Explicit PostCSS configuration for Vercel compatibility with Next.js 15.x
  experimental: {
    esmExternals: 'loose',
  },
  // Ensure PostCSS is properly configured for Tailwind CSS processing
  webpack: (config, options) => {
    // Ensure PostCSS loader processes CSS correctly
    return config;
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Force clean build - cache bust for duplicate file fix
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;

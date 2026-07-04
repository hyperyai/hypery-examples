import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Disable static optimization for pages that use client-side features
  reactStrictMode: true,
  
  // Disable ESLint during builds (run separately in CI)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Required headers for WebContainers (cross-origin isolation)
  // Using credentialless instead of require-corp to allow CDN resources
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
  
};

export default nextConfig;

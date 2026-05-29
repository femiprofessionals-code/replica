import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // We type-check separately with `tsc --noEmit`; do not fail builds on lint.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;

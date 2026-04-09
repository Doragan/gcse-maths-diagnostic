import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return []
  },
  trailingSlash: false,
}

export default nextConfig;
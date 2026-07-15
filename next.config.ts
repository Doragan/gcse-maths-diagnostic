import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return []
  },
  // Baseline security headers. Deliberately NOT a full CSP — the param engine
  // relies on client-side `new Function`, so a strict script-src would need
  // 'unsafe-eval' and can't bound the real risk (that deferral is tracked
  // separately). These three are the uncontroversial headers that don't touch
  // script execution: clickjacking, MIME-sniffing, and referrer leakage.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
  trailingSlash: false,
}

export default nextConfig;
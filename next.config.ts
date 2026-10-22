import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Runs as a Node.js server on Hostinger (next start), so /products/[slug] renders
  // any slug on request straight from the Fastify API — a static export can't do that.
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  // Baseline browser protections. No script/style CSP and no COOP here: Razorpay Checkout loads its own script, frames
  // and popups. Clickjacking (frame-ancestors / X-Frame-Options), MIME sniffing, referrer leakage and plugins are closed.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;

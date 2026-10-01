import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Runs as a Node.js server on Hostinger (next start), so /products/[slug] renders
  // any slug on request straight from the Fastify API — a static export can't do that.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;

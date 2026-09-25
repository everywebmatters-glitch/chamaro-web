import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export to out/ for Hostinger; the API is the Fastify backend
  output: "export",
  // Emit products/index.html instead of products.html so Apache serves /products/
  trailingSlash: true,
  // The default image loader needs a Node server
  images: { unoptimized: true },
};

export default nextConfig;

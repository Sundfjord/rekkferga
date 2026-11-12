import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app is entirely client-side, so it builds to plain static files (`out/`) that
  // Cloudflare Pages serves directly — no Next.js server.
  output: "export",
  // Static export has no image-optimisation server; next/image renders the files as-is.
  images: { unoptimized: true },
};

export default nextConfig;

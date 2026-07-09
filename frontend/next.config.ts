import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Netlify — outputs to /out which Netlify serves directly.
  output: "export",
  // Required for static export: images must use unoptimized mode since
  // Next.js image optimization needs a server runtime.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

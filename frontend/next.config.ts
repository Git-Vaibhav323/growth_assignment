import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: "standalone" output is only for Docker/Node self-hosted deployments.
  // For Netlify, output mode is omitted — Netlify's Next.js plugin handles
  // the build and routing automatically.
};

export default nextConfig;

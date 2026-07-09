import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained server bundle (only the deps actually used)
  // so the Docker runtime image doesn't need node_modules copied in full.
  output: "standalone",
};

export default nextConfig;

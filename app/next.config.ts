import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const currentDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: currentDir,
  },
  outputFileTracingRoot: currentDir,
  serverExternalPackages: ["discord.js", "sharp"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

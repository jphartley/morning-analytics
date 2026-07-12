import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const currentDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_CONFIGURED_IMAGE_PROVIDER:
      process.env.IMAGE_GENERATION_PROVIDER
      || process.env.NEXT_PUBLIC_IMAGE_PROVIDER
      || "midjourney",
    NEXT_PUBLIC_IMAGE_PROVIDER_DUAL_MODE_ENABLED:
      process.env.NEXT_PUBLIC_IMAGE_PROVIDER_DUAL_MODE_ENABLED || "false",
  },
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

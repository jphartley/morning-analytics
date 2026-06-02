import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const currentDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: currentDir,
  },
  outputFileTracingRoot: currentDir,
  outputFileTracingIncludes: {
    "/": ["./prompts/**/*.md", "./public/mock-images/**/*"],
    "/*": ["./prompts/**/*.md", "./public/mock-images/**/*"],
  },
  serverExternalPackages: ["discord.js", "sharp"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

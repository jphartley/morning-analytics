import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const tracedRuntimeAssets = [
  "./prompts/**/*",
  "./public/mock-images/**/*",
  "./node_modules/sharp/**/*",
  "./node_modules/discord.js/**/*",
];

const nextConfig: NextConfig = {
  turbopack: {
    root: currentDir,
  },
  output: "standalone",
  outputFileTracingRoot: currentDir,
  // Standalone deployments need runtime-loaded prompts and mock fixtures traced.
  outputFileTracingIncludes: {
    "/": tracedRuntimeAssets,
    "/*": tracedRuntimeAssets,
  },
  serverExternalPackages: ["discord.js", "sharp"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;

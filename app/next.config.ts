import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { getImageTrialCandidate } from "./lib/image-providers/availability";

const currentDir = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_CONFIGURED_IMAGE_TRIAL_CANDIDATE: getImageTrialCandidate(
      process.env.IMAGE_PROVIDER_TRIAL_CANDIDATE,
      process.env.IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED === "true"
    ) || "",
    NEXT_PUBLIC_CONFIGURED_IMAGE_PROVIDER:
      process.env.IMAGE_GENERATION_PROVIDER
      || "midjourney",
    NEXT_PUBLIC_CONFIGURED_IMAGE_DUAL_MODE_ENABLED:
      process.env.IMAGE_PROVIDER_DUAL_MODE_ENABLED === "true" ? "true" : "false",
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

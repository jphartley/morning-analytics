import { blackForestLabsImageProvider } from "./black-forest-labs";
import { midjourneyImageProvider } from "./midjourney";
import { mockImageProvider } from "./mock";
import type { ImageProvider, ImageProviderId } from "./types";
import { IMAGE_PROVIDER_IDS, ImageProviderError } from "./types";

const PROVIDERS: Record<ImageProviderId, ImageProvider> = {
  mock: mockImageProvider,
  midjourney: midjourneyImageProvider,
  "black-forest-labs": blackForestLabsImageProvider,
};

export interface ResolveImageProviderOptions {
  override?: string | null;
}

export interface ResolvedImageProvider {
  id: ImageProviderId;
  provider: ImageProvider;
  source: "deployment-default" | "test-override";
}

export interface ResolvedImageGenerationSelection {
  selection: ImageProviderId | "dual";
  providers: ResolvedImageProvider[];
}

export function isImageProviderId(value: string): value is ImageProviderId {
  return IMAGE_PROVIDER_IDS.includes(value as ImageProviderId);
}

export function getDeploymentImageProviderId(): ImageProviderId {
  const configured = process.env.IMAGE_GENERATION_PROVIDER
    || process.env.NEXT_PUBLIC_IMAGE_PROVIDER
    || "midjourney";

  if (!isImageProviderId(configured)) {
    throw new ImageProviderError(
      "configuration",
      `Unsupported image provider "${configured}". Expected one of: ${IMAGE_PROVIDER_IDS.join(", ")}.`
    );
  }

  return configured;
}

export function resolveImageProvider(
  options: ResolveImageProviderOptions = {}
): ResolvedImageProvider {
  const override = options.override?.trim();
  if (override) {
    if (process.env.IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED !== "true") {
      throw new ImageProviderError(
        "configuration",
        "Image provider overrides are disabled on the server."
      );
    }
    if (!isImageProviderId(override)) {
      throw new ImageProviderError(
        "configuration",
        `Unsupported image provider override "${override}".`
      );
    }

    return {
      id: override,
      provider: PROVIDERS[override],
      source: "test-override",
    };
  }

  const id = getDeploymentImageProviderId();
  return {
    id,
    provider: PROVIDERS[id],
    source: "deployment-default",
  };
}

export function resolveImageGenerationSelection(
  options: ResolveImageProviderOptions = {}
): ResolvedImageGenerationSelection {
  const override = options.override?.trim();

  if (override === "dual") {
    if (process.env.IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED !== "true") {
      throw new ImageProviderError(
        "configuration",
        "Image provider overrides are disabled on the server."
      );
    }
    if (process.env.IMAGE_PROVIDER_DUAL_MODE_ENABLED !== "true") {
      throw new ImageProviderError(
        "configuration",
        "Dual image provider mode is disabled on the server."
      );
    }

    return {
      selection: "dual",
      providers: ["black-forest-labs", "midjourney"].map((id) => ({
        id: id as ImageProviderId,
        provider: PROVIDERS[id as ImageProviderId],
        source: "test-override" as const,
      })),
    };
  }

  const resolved = resolveImageProvider(options);
  return {
    selection: resolved.id,
    providers: [resolved],
  };
}

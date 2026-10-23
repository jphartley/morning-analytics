import { midjourneyImageProvider } from "./midjourney";
import { mockImageProvider } from "./mock";
import type { ImageProvider, ImageProviderId } from "./types";
import { IMAGE_PROVIDER_IDS, ImageProviderError } from "./types";
import { getImageTrialCandidate, isImageProviderAvailable } from "./availability";

const PROVIDERS: Record<ImageProviderId, ImageProvider> = {
  mock: mockImageProvider,
  midjourney: midjourneyImageProvider,
  "black-forest-labs": {
    id: "black-forest-labs",
    async generateImageSet(request) {
      const { blackForestLabsImageProvider } = await import("./black-forest-labs");
      return blackForestLabsImageProvider.generateImageSet(request);
    },
  },
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

function getTrialCandidate(): ImageProviderId | null {
  return getImageTrialCandidate(
    process.env.IMAGE_PROVIDER_TRIAL_CANDIDATE,
    process.env.IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED === "true"
  );
}

function assertProviderAvailable(id: ImageProviderId): void {
  if (!isImageProviderAvailable(id, getTrialCandidate())) {
    throw new ImageProviderError(
      "configuration",
      `Image provider "${id}" is disabled. Configure an authorized IMAGE_PROVIDER_TRIAL_CANDIDATE to enable a trial, or use midjourney or mock.`
    );
  }
}

export function getDeploymentImageProviderId(): ImageProviderId {
  const configured = process.env.IMAGE_GENERATION_PROVIDER
    || "midjourney";

  if (!isImageProviderId(configured)) {
    throw new ImageProviderError(
      "configuration",
      `Unsupported image provider "${configured}". Expected one of: ${IMAGE_PROVIDER_IDS.join(", ")}.`
    );
  }

  assertProviderAvailable(configured);
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

    assertProviderAvailable(override);
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

    const candidate = getTrialCandidate();
    if (!candidate) {
      throw new ImageProviderError(
        "configuration",
        "Dual mode requires an available IMAGE_PROVIDER_TRIAL_CANDIDATE distinct from midjourney and mock."
      );
    }

    return {
      selection: "dual",
      providers: [candidate, "midjourney" as const].map((id) => ({
        id,
        provider: PROVIDERS[id],
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

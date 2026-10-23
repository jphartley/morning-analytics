import { IMAGE_PROVIDER_IDS } from "./types";
import type { ImageProviderId } from "./types";

// Known IDs also validate historical batches; availability only controls new work.
export function getImageTrialCandidate(
  configured: string | null | undefined,
  overridesEnabled: boolean
): ImageProviderId | null {
  const candidate = configured?.trim();
  return overridesEnabled
    && candidate !== "midjourney"
    && candidate !== "mock"
    && IMAGE_PROVIDER_IDS.includes(candidate as ImageProviderId)
    ? candidate as ImageProviderId
    : null;
}

export function isImageProviderAvailable(
  provider: ImageProviderId,
  trialCandidate: ImageProviderId | null
): boolean {
  return provider === "mock" || provider === "midjourney" || provider === trialCandidate;
}

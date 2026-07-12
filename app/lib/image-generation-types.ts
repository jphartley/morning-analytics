import type { ImageGenerationDiagnostics } from "./image-generation-diagnostics";
import { IMAGE_PROVIDER_IDS } from "./image-providers/types";
import type { ImageProviderErrorCode, ImageProviderId } from "./image-providers/types";

export const DUAL_IMAGE_GENERATION_SELECTION = "dual" as const;

export type ImageGenerationSelection =
  | ImageProviderId
  | typeof DUAL_IMAGE_GENERATION_SELECTION;

export type ProviderResultStatus = "success" | "failed";

export interface ImageGenerationBatch {
  version: 1;
  attemptId: string;
  provider: ImageProviderId;
  model: string | null;
  prompt: string;
  status: ProviderResultStatus;
  imagePaths: string[];
  createdAt: string;
  errorCode?: ImageProviderErrorCode | "unexpected" | "upload-failed";
}

export interface ProviderResultGroup {
  attemptId: string;
  provider: ImageProviderId;
  model: string | null;
  prompt: string;
  status: ProviderResultStatus;
  imageUrls: string[];
  imagePaths: string[];
  diagnostics: ImageGenerationDiagnostics;
  error?: string;
  errorCode?: ImageGenerationBatch["errorCode"];
}

export interface ImageDisplayGroup {
  id: string;
  provider: ImageProviderId | null;
  label: string;
  prompt: string | null;
  status: ProviderResultStatus;
  imageUrls: string[];
  error?: string;
}

export function isImageGenerationSelection(value: string): value is ImageGenerationSelection {
  return value === DUAL_IMAGE_GENERATION_SELECTION
    || IMAGE_PROVIDER_IDS.includes(value as ImageProviderId);
}

export function imageProviderLabel(provider: ImageProviderId): string {
  switch (provider) {
    case "black-forest-labs":
      return "Black Forest Labs";
    case "midjourney":
      return "Midjourney";
    default:
      return "Mock provider";
  }
}

export function requiredImageCapacity(selection: ImageGenerationSelection): number {
  return selection === DUAL_IMAGE_GENERATION_SELECTION ? 8 : 4;
}

export function providerResultGroupToBatch(group: ProviderResultGroup): ImageGenerationBatch {
  return {
    version: 1,
    attemptId: group.attemptId,
    provider: group.provider,
    model: group.model,
    prompt: group.prompt,
    status: group.status,
    imagePaths: group.status === "success" ? [...group.imagePaths] : [],
    createdAt: group.diagnostics.completedAt || group.diagnostics.startedAt,
    ...(group.errorCode ? { errorCode: group.errorCode } : {}),
  };
}

export function providerResultGroupToDisplayGroup(group: ProviderResultGroup): ImageDisplayGroup {
  return {
    id: group.attemptId,
    provider: group.provider,
    label: imageProviderLabel(group.provider),
    prompt: group.prompt,
    status: group.status,
    imageUrls: group.imageUrls,
    error: group.error,
  };
}

export function flattenDisplayGroupUrls(groups: ImageDisplayGroup[]): string[] {
  return groups.flatMap((group) => group.imageUrls);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isProvider(value: unknown): value is ImageProviderId {
  return typeof value === "string"
    && IMAGE_PROVIDER_IDS.includes(value as ImageProviderId);
}

function isErrorCode(value: unknown): value is NonNullable<ImageGenerationBatch["errorCode"]> {
  return typeof value === "string" && [
    "configuration",
    "authentication",
    "insufficient-credits",
    "rate-limited",
    "moderated",
    "timeout",
    "unavailable",
    "invalid-response",
    "download-failed",
    "incomplete-set",
    "unexpected",
    "upload-failed",
  ].includes(value);
}

export function parseImageGenerationBatch(value: unknown): ImageGenerationBatch | null {
  if (!isRecord(value)
    || value.version !== 1
    || typeof value.attemptId !== "string"
    || !isProvider(value.provider)
    || !(typeof value.model === "string" || value.model === null)
    || typeof value.prompt !== "string"
    || (value.status !== "success" && value.status !== "failed")
    || !Array.isArray(value.imagePaths)
    || !value.imagePaths.every((path) => typeof path === "string")
    || typeof value.createdAt !== "string"
    || (value.errorCode !== undefined && !isErrorCode(value.errorCode))) {
    return null;
  }

  if (value.status === "success" && value.imagePaths.length !== 4) {
    return null;
  }

  if (value.status === "failed" && value.imagePaths.length !== 0) {
    return null;
  }

  return {
    version: 1,
    attemptId: value.attemptId,
    provider: value.provider,
    model: value.model,
    prompt: value.prompt,
    status: value.status,
    imagePaths: [...value.imagePaths],
    createdAt: value.createdAt,
    ...(value.errorCode ? { errorCode: value.errorCode } : {}),
  };
}

export function parseImageGenerationBatches(value: unknown): ImageGenerationBatch[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(parseImageGenerationBatch)
    .filter((batch): batch is ImageGenerationBatch => batch !== null);
}

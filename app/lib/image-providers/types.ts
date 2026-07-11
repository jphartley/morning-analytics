import type { ImageGenerationDiagnosticsRecorder } from "@/lib/image-generation-diagnostics";

export const IMAGE_PROVIDER_IDS = [
  "mock",
  "midjourney",
  "black-forest-labs",
] as const;

export type ImageProviderId = (typeof IMAGE_PROVIDER_IDS)[number];

export type ImageProviderErrorCode =
  | "configuration"
  | "authentication"
  | "insufficient-credits"
  | "rate-limited"
  | "moderated"
  | "timeout"
  | "unavailable"
  | "invalid-response"
  | "download-failed"
  | "incomplete-set";

export interface GenerateImageSetRequest {
  attemptId: string;
  prompt: string;
  count: number;
  diagnostics: ImageGenerationDiagnosticsRecorder;
  signal?: AbortSignal;
}

export interface GeneratedImageSet {
  provider: ImageProviderId;
  model?: string;
  imageDataUrls: string[];
  providerRequestIds?: string[];
}

export interface ImageProvider {
  id: ImageProviderId;
  generateImageSet(request: GenerateImageSetRequest): Promise<GeneratedImageSet>;
}

export class ImageProviderError extends Error {
  constructor(
    public readonly code: ImageProviderErrorCode,
    message: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = "ImageProviderError";
  }
}


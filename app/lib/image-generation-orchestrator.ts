import { v4 as uuidv4 } from "uuid";
import { uploadImagesToStorage } from "./analytics-storage";
import {
  createImageGenerationDiagnosticsRecorder,
} from "./image-generation-diagnostics";
import {
  ImageGenerationBatch,
  ProviderResultGroup,
  imageProviderLabel,
  providerResultGroupToBatch,
} from "./image-generation-types";
import type {
  ResolvedImageGenerationSelection,
  ResolvedImageProvider,
} from "./image-providers/registry";
import { ImageProviderError } from "./image-providers/types";

const GENERATED_IMAGE_COUNT = 4;

export interface ExecuteImageGenerationOptions {
  analysisId: string;
  userId: string;
  prompt: string;
  startIndex: number;
  resolvedSelection: ResolvedImageGenerationSelection;
  context: "initial" | "regeneration";
}

export interface ImageGenerationExecutionResult {
  success: boolean;
  partial: boolean;
  groups: ProviderResultGroup[];
  batches: ImageGenerationBatch[];
  imageUrls: string[];
  imagePaths: string[];
  diagnostics: ProviderResultGroup["diagnostics"][];
  error?: string;
  uploadError?: string;
}

async function executeProviderAttempt(
  options: Omit<ExecuteImageGenerationOptions, "resolvedSelection"> & {
    resolvedProvider: ResolvedImageProvider;
  }
): Promise<ProviderResultGroup> {
  const { analysisId, userId, prompt, startIndex, resolvedProvider, context } = options;
  const attemptId = uuidv4();
  const diagnostics = createImageGenerationDiagnosticsRecorder(attemptId, resolvedProvider.id);
  diagnostics.add(
    "provider-selection",
    "info",
    context === "regeneration"
      ? "Image provider selected for regeneration."
      : "Image provider selected.",
    {
      provider: resolvedProvider.id,
      source: resolvedProvider.source,
      startIndex,
    }
  );

  try {
    const generated = await resolvedProvider.provider.generateImageSet({
      attemptId,
      prompt,
      count: GENERATED_IMAGE_COUNT,
      diagnostics,
    });

    if (generated.imageDataUrls.length !== GENERATED_IMAGE_COUNT) {
      throw new ImageProviderError(
        "incomplete-set",
        `${imageProviderLabel(resolvedProvider.id)} returned ${generated.imageDataUrls.length} images instead of ${GENERATED_IMAGE_COUNT}.`
      );
    }

    const uploadResult = await uploadImagesToStorage(
      analysisId,
      generated.imageDataUrls,
      userId,
      startIndex,
      diagnostics
    );

    if (uploadResult.error) {
      return {
        attemptId,
        provider: resolvedProvider.id,
        model: generated.model || null,
        prompt,
        status: "failed",
        imageUrls: generated.imageDataUrls,
        imagePaths: [],
        diagnostics: diagnostics.complete(
          "warning",
          `${imageProviderLabel(resolvedProvider.id)} images were generated, but upload failed.`
        ),
        error: uploadResult.error,
        errorCode: "upload-failed",
      };
    }

    return {
      attemptId,
      provider: resolvedProvider.id,
      model: generated.model || null,
      prompt,
      status: "success",
      imageUrls: generated.imageDataUrls,
      imagePaths: uploadResult.paths,
      diagnostics: diagnostics.complete(
        "success",
        `${imageProviderLabel(resolvedProvider.id)} images were generated and uploaded.`
      ),
    };
  } catch (error) {
    const errorCode = error instanceof ImageProviderError ? error.code : "unexpected";
    const message = error instanceof Error ? error.message : "Failed to generate images.";
    diagnostics.add("attempt", "error", "Image generation failed.", {
      code: errorCode,
      error: message,
    });

    return {
      attemptId,
      provider: resolvedProvider.id,
      model: null,
      prompt,
      status: "failed",
      imageUrls: [],
      imagePaths: [],
      diagnostics: diagnostics.complete(
        "error",
        `${imageProviderLabel(resolvedProvider.id)} image generation failed.`
      ),
      error: message,
      errorCode,
    };
  }
}

export async function executeImageGeneration(
  options: ExecuteImageGenerationOptions
): Promise<ImageGenerationExecutionResult> {
  const groups: ProviderResultGroup[] = [];
  let nextStartIndex = options.startIndex;

  for (const resolvedProvider of options.resolvedSelection.providers) {
    const group = await executeProviderAttempt({
      ...options,
      resolvedProvider,
      startIndex: nextStartIndex,
    });
    groups.push(group);
    nextStartIndex += group.imagePaths.length;
  }

  const successfulGroups = groups.filter((group) => group.status === "success");
  const success = successfulGroups.length > 0;
  const partial = success && successfulGroups.length < groups.length;
  const uploadFailure = groups.find((group) => group.errorCode === "upload-failed");

  return {
    success,
    partial,
    groups,
    batches: groups.map(providerResultGroupToBatch),
    imageUrls: successfulGroups.flatMap((group) => group.imageUrls),
    imagePaths: successfulGroups.flatMap((group) => group.imagePaths),
    diagnostics: groups.map((group) => group.diagnostics),
    ...(!success ? { error: "Image generation failed for all selected providers." } : {}),
    ...(uploadFailure ? { uploadError: uploadFailure.error } : {}),
  };
}

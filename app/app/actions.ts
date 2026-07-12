"use server";

import { v4 as uuidv4 } from "uuid";
import { analyzeWithGemini } from "@/lib/gemini";
import { assertServerSupabaseEnv } from "@/lib/supabase";
import { saveAnalysis as saveToStorage, uploadImagesToStorage, updateAnalysisImagePaths } from "@/lib/analytics-storage";
import { getServerSupabase } from "@/lib/supabase";
import {
  createImageGenerationDiagnosticsRecorder,
  ImageGenerationDiagnostics,
  ImageGenerationDiagnosticsRecorder,
} from "@/lib/image-generation-diagnostics";
import { resolveImageProvider } from "@/lib/image-providers/registry";
import { ImageProviderError } from "@/lib/image-providers/types";
import type { ImageProviderId } from "@/lib/image-providers/types";

assertServerSupabaseEnv();

// Response types
export interface TextAnalysisResponse {
  success: boolean;
  analysisText?: string;
  imagePrompt?: string;
  error?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrls?: string[];
  imagePaths?: string[]; // Storage paths for saving
  analysisId?: string;
  diagnostics?: ImageGenerationDiagnostics;
  uploadError?: string;
  error?: string;
}

export interface SaveAnalysisResponse {
  success: boolean;
  id?: string;
  error?: string;
}

export interface RegenerateImagesResponse {
  success: boolean;
  imageUrls?: string[];
  imagePaths?: string[];
  diagnostics?: ImageGenerationDiagnostics;
  uploadError?: string;
  error?: string;
}

const MAX_IMAGES_PER_ANALYSIS = 20;
const GENERATED_IMAGE_COUNT = 4;

function providerLabel(provider: ImageProviderId): string {
  switch (provider) {
    case "black-forest-labs":
      return "Black Forest Labs";
    case "midjourney":
      return "Midjourney";
    default:
      return "Mock provider";
  }
}

/**
 * Phase 1: Analyze text with Gemini
 * Returns analysis text and image prompt for Phase 2
 * Requires authenticated user - userId passed from client session
 */
export async function analyzeText(
  journalText: string,
  userId: string,
  modelId?: string,
  persona: string = "jungian"
): Promise<TextAnalysisResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User must be authenticated to analyze text.",
      };
    }

    if (!journalText || journalText.trim().length === 0) {
      return {
        success: false,
        error: "Please enter some text to analyze.",
      };
    }

    const geminiResult = await analyzeWithGemini(journalText, modelId, persona);

    return {
      success: true,
      analysisText: geminiResult.analysisText,
      imagePrompt: geminiResult.imagePrompt || undefined,
    };
  } catch (error) {
    console.error("Text analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze text.",
    };
  }
}

/**
 * Phase 2: Generate exactly four images with the selected provider.
 * Also uploads them to Supabase storage and returns their paths.
 */
export async function generateImages(
  imagePrompt: string,
  userId: string,
  providerOverride?: string | null,
  testMode: boolean = false
): Promise<ImageGenerationResponse> {
  const analysisId = uuidv4();
  const attemptId = uuidv4();
  let diagnostics: ImageGenerationDiagnosticsRecorder | undefined;

  try {
    if (!userId) {
      return {
        success: false,
        analysisId,
        error: "User must be authenticated to generate images.",
      };
    }

    if (!imagePrompt || imagePrompt.trim().length === 0) {
      return {
        success: false,
        analysisId,
        error: "No image prompt provided.",
      };
    }

    const resolved = resolveImageProvider({ override: providerOverride, testMode });
    diagnostics = createImageGenerationDiagnosticsRecorder(attemptId, resolved.id);
    diagnostics.add("provider-selection", "info", "Image provider selected.", {
      provider: resolved.id,
      source: resolved.source,
    });

    const generated = await resolved.provider.generateImageSet({
      attemptId,
      prompt: imagePrompt,
      count: GENERATED_IMAGE_COUNT,
      diagnostics,
    });
    if (generated.imageDataUrls.length !== GENERATED_IMAGE_COUNT) {
      throw new ImageProviderError(
        "incomplete-set",
        `${providerLabel(resolved.id)} returned ${generated.imageDataUrls.length} images instead of ${GENERATED_IMAGE_COUNT}.`
      );
    }

    const uploadResult = await uploadImagesToStorage(
      analysisId,
      generated.imageDataUrls,
      userId,
      0,
      diagnostics
    );
    const status = uploadResult.error ? "warning" : "success";
    const summary = uploadResult.error
      ? `${providerLabel(resolved.id)} images were generated, but upload failed.`
      : `${providerLabel(resolved.id)} images were generated and uploaded.`;

    return {
      success: true,
      imageUrls: generated.imageDataUrls,
      imagePaths: uploadResult.paths,
      analysisId,
      diagnostics: diagnostics.complete(status, summary),
      uploadError: uploadResult.error,
    };
  } catch (error) {
    console.error("Image generation error:", error);
    diagnostics?.add("attempt", "error", "Image generation failed.", {
      code: error instanceof ImageProviderError ? error.code : "unexpected",
      error: error instanceof Error ? error.message : "Unknown image generation error",
    });
    return {
      success: false,
      analysisId,
      diagnostics: diagnostics?.complete("error", "Image generation failed."),
      error: error instanceof Error ? error.message : "Failed to generate images.",
    };
  }
}

/**
 * Save an analysis to persistent storage
 * imagePaths should be storage paths from generateImages, not base64 data
 * Requires authenticated user - userId passed from client session
 */
export async function saveAnalysis(
  inputText: string,
  analysisText: string,
  imagePrompt: string | null,
  modelId: string,
  imagePaths: string[],
  userId: string,
  analysisId?: string,
  analystPersona: string = "jungian"
): Promise<SaveAnalysisResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        error: "User must be authenticated to save analysis.",
      };
    }

    const result = await saveToStorage(
      inputText,
      analysisText,
      imagePrompt,
      modelId,
      imagePaths,
      analysisId,
      analystPersona,
      userId
    );
    return result;
  } catch (error) {
    console.error("Save analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save analysis.",
    };
  }
}

/**
 * Regenerate images for an existing analysis.
 * Reuses the stored image_prompt, appends new images to existing paths.
 */
export async function regenerateImages(
  analysisId: string,
  userId: string,
  providerOverride?: string | null,
  testMode: boolean = false
): Promise<RegenerateImagesResponse> {
  let diagnostics: ImageGenerationDiagnosticsRecorder | undefined;

  try {
    if (!userId) {
      return { success: false, error: "User must be authenticated to regenerate images." };
    }

    // Fetch the existing analysis (service role bypasses RLS)
    const supabase = getServerSupabase();
    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select("image_prompt, image_paths, user_id")
      .eq("id", analysisId)
      .single();

    if (fetchError || !analysis) {
      return { success: false, error: "Analysis not found." };
    }

    if (analysis.user_id !== userId) {
      return { success: false, error: "Not authorized to modify this analysis." };
    }

    if (!analysis.image_prompt) {
      return { success: false, error: "This analysis has no image prompt." };
    }

    const currentPaths: string[] = analysis.image_paths || [];
    if (currentPaths.length + GENERATED_IMAGE_COUNT > MAX_IMAGES_PER_ANALYSIS) {
      return { success: false, error: `Maximum of ${MAX_IMAGES_PER_ANALYSIS} images reached.` };
    }

    const startIndex = currentPaths.length;
    const attemptId = uuidv4();
    const resolved = resolveImageProvider({ override: providerOverride, testMode });
    diagnostics = createImageGenerationDiagnosticsRecorder(attemptId, resolved.id);
    diagnostics.add("provider-selection", "info", "Image provider selected for regeneration.", {
      provider: resolved.id,
      source: resolved.source,
      startIndex,
   });

    const generated = await resolved.provider.generateImageSet({
      attemptId,
      prompt: analysis.image_prompt,
      count: GENERATED_IMAGE_COUNT,
      diagnostics,
    });
    const newImageUrls = generated.imageDataUrls;
    if (newImageUrls.length !== GENERATED_IMAGE_COUNT) {
      throw new ImageProviderError(
        "incomplete-set",
        `${providerLabel(resolved.id)} returned ${newImageUrls.length} images instead of ${GENERATED_IMAGE_COUNT}.`
      );
    }

    // Upload with offset index
    const uploadResult = await uploadImagesToStorage(analysisId, newImageUrls, userId, startIndex, diagnostics);

    if (uploadResult.error) {
      return {
        success: false,
        diagnostics: diagnostics.complete("error", "Images were generated, but upload failed."),
        error: uploadResult.error,
      };
    }

    // Append paths to the database record
    const updateResult = await updateAnalysisImagePaths(analysisId, uploadResult.paths);
    if (!updateResult.success) {
      return {
        success: true,
        imageUrls: newImageUrls,
        imagePaths: uploadResult.paths,
        diagnostics: diagnostics.complete("warning", "Images generated and uploaded, but database update failed."),
        uploadError: "Images generated but failed to update database: " + updateResult.error,
      };
    }

    return {
      success: true,
      imageUrls: newImageUrls,
      imagePaths: uploadResult.paths,
      diagnostics: diagnostics.complete("success", "Images regenerated, uploaded, and appended to the analysis."),
    };
  } catch (error) {
    console.error("Image regeneration error:", error);
    diagnostics?.add("attempt", "error", "Image regeneration failed.", {
      code: error instanceof ImageProviderError ? error.code : "unexpected",
      error: error instanceof Error ? error.message : "Unknown image regeneration error",
    });
    return {
      success: false,
      diagnostics: diagnostics?.complete("error", "Image regeneration failed."),
      error: error instanceof Error ? error.message : "Failed to regenerate images.",
    };
  }
}

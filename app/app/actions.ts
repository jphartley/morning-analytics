"use server";

import { v4 as uuidv4 } from "uuid";
import { analyzeWithGemini } from "@/lib/gemini";
import { assertServerSupabaseEnv } from "@/lib/supabase";
import {
  saveAnalysis as saveToStorage,
  updateAnalysisImageGeneration,
  deleteAnalysisWithImages,
  DeleteFailureCode,
} from "@/lib/analytics-storage";
import { getServerSupabase } from "@/lib/supabase";
import {
  ImageGenerationDiagnostics,
} from "@/lib/image-generation-diagnostics";
import { executeImageGeneration } from "@/lib/image-generation-orchestrator";
import {
  ImageGenerationBatch,
  ProviderResultGroup,
  requiredImageCapacity,
} from "@/lib/image-generation-types";
import { resolveImageGenerationSelection } from "@/lib/image-providers/registry";
import { selectMemoryContext, updateMemoryForSavedAnalysis } from "@/lib/memory-service";
import type { MemoryContextItem } from "@/lib/memory-types";
import {
  getNewestEntriesForReplay,
  listMemoriesWithEvidence,
  resetMemoryStore,
} from "@/lib/memory-storage";
import type { MemoryWithEvidence } from "@/lib/memory-types";
import {
  normalizeMemoryRebuildCount,
  rebuildMemoryStore,
} from "@/lib/memory-rebuild";
import type { MemoryRebuildFailure } from "@/lib/memory-rebuild";
import {
  getMemoryActionErrorMessage,
  getMemoryRebuildFailure,
} from "@/lib/memory-errors";
import type { MemoryRebuildFailureDetail } from "@/lib/memory-errors";

assertServerSupabaseEnv();

// Response types
export interface TextAnalysisResponse {
  success: boolean;
  analysisText?: string;
  imagePrompt?: string;
  memoryContext?: MemoryContextItem[];
  memoryWarning?: string;
  error?: string;
}

export interface BlindComparisonOption extends TextAnalysisResponse {
  usesMemory: boolean;
}

export interface BlindComparisonResponse {
  success: boolean;
  withMemory?: BlindComparisonOption;
  withoutMemory?: BlindComparisonOption;
  error?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrls?: string[];
  imagePaths?: string[]; // Storage paths for saving
  analysisId?: string;
  groups?: ProviderResultGroup[];
  batches?: ImageGenerationBatch[];
  diagnostics?: ImageGenerationDiagnostics[];
  partial?: boolean;
  uploadError?: string;
  error?: string;
}

export interface SaveAnalysisResponse {
  success: boolean;
  id?: string;
  error?: string;
}

export interface MemoryUpdateResponse {
  success: boolean;
  changedCount?: number;
  error?: string;
}

export interface MemoryStoreResponse {
  success: boolean;
  memories?: MemoryWithEvidence[];
  error?: string;
}

export interface MemoryRebuildResponse {
  success: boolean;
  attempted: number;
  succeeded: number;
  skipped: number;
  total: number;
  failures: MemoryRebuildFailure[];
  error?: string;
}

export interface MemoryRebuildEntryReference {
  analysisId: string;
  createdAt: string;
}

export interface MemoryRebuildPreparationResponse {
  success: boolean;
  entries: MemoryRebuildEntryReference[];
  error?: string;
}

export interface MemoryRebuildEntryResponse {
  success: boolean;
  failure?: MemoryRebuildFailureDetail;
  error?: string;
}

export interface RegenerateImagesResponse {
  success: boolean;
  imageUrls?: string[];
  imagePaths?: string[];
  groups?: ProviderResultGroup[];
  diagnostics?: ImageGenerationDiagnostics[];
  partial?: boolean;
  uploadError?: string;
  error?: string;
}

export interface DeleteAnalysisResponse {
  success: boolean;
  error?: string;
}

const MAX_IMAGES_PER_ANALYSIS = 20;

// User-safe, secret-free messages for each internal delete failure code.
// Full Supabase error detail is logged server-side only, inside deleteAnalysisWithImages.
const DELETE_FAILURE_MESSAGES: Record<DeleteFailureCode, string> = {
  not_found: "Analysis not found.",
  forbidden: "Not authorized to delete this analysis.",
  storage_failed: "Couldn't remove all images — please retry.",
  db_failed: "Couldn't finish deleting — please retry.",
};

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

    const memorySelection = await selectMemoryContext(journalText, userId, modelId);
    const geminiResult = await analyzeWithGemini(
      journalText,
      modelId,
      persona,
      memorySelection.context
    );

    return {
      success: true,
      analysisText: geminiResult.analysisText,
      imagePrompt: geminiResult.imagePrompt || undefined,
      memoryContext: memorySelection.context,
      memoryWarning: memorySelection.warning,
    };
  } catch (error) {
    console.error("Text analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to analyze text.",
    };
  }
}

export async function compareTextAnalyses(
  journalText: string,
  userId: string,
  modelId?: string,
  persona: string = "jungian"
): Promise<BlindComparisonResponse> {
  try {
    if (!userId) return { success: false, error: "User must be authenticated to compare analyses." };
    if (!journalText || !journalText.trim()) {
      return { success: false, error: "Please enter some text to analyze." };
    }

    const memorySelection = await selectMemoryContext(journalText, userId, modelId);
    const [withMemoryResult, withoutMemoryResult] = await Promise.all([
      analyzeWithGemini(journalText, modelId, persona, memorySelection.context),
      analyzeWithGemini(journalText, modelId, persona, []),
    ]);

    return {
      success: true,
      withMemory: {
        success: true,
        usesMemory: true,
        analysisText: withMemoryResult.analysisText,
        imagePrompt: withMemoryResult.imagePrompt || undefined,
        memoryContext: memorySelection.context,
        memoryWarning: memorySelection.warning,
      },
      withoutMemory: {
        success: true,
        usesMemory: false,
        analysisText: withoutMemoryResult.analysisText,
        imagePrompt: withoutMemoryResult.imagePrompt || undefined,
        memoryContext: [],
      },
    };
  } catch (error) {
    console.error("Blind comparison error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to compare analyses.",
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
  providerOverride?: string | null
): Promise<ImageGenerationResponse> {
  const analysisId = uuidv4();

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

    const resolvedSelection = resolveImageGenerationSelection({
      override: providerOverride,
    });
    const result = await executeImageGeneration({
      analysisId,
      userId,
      prompt: imagePrompt,
      startIndex: 0,
      resolvedSelection,
      context: "initial",
    });

    return {
      ...result,
      analysisId,
    };
  } catch (error) {
    console.error("Image generation error:", error);
    return {
      success: false,
      analysisId,
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
  analystPersona: string = "jungian",
  imageGenerationBatches: ImageGenerationBatch[] = [],
  memoryContext: MemoryContextItem[] = []
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
      userId,
      imageGenerationBatches,
      memoryContext
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

export async function updateMemory(
  analysisId: string,
  userId: string,
  modelId?: string
): Promise<MemoryUpdateResponse> {
  try {
    if (!userId || !analysisId) {
      return { success: false, error: "A saved analysis is required to update memory." };
    }

    const changedCount = await updateMemoryForSavedAnalysis(analysisId, userId, modelId);
    return { success: true, changedCount };
  } catch (error) {
    console.error("Memory update error:", error);
    return {
      success: false,
      error: getMemoryActionErrorMessage(
        error,
        "Analysis saved, but contextual memory could not be updated."
      ),
    };
  }
}

export async function getMemoryStore(userId: string): Promise<MemoryStoreResponse> {
  try {
    if (!userId) return { success: false, error: "Authentication is required." };
    return { success: true, memories: await listMemoriesWithEvidence(userId) };
  } catch (error) {
    console.error("Memory store read error:", error);
    return {
      success: false,
      error: getMemoryActionErrorMessage(error, "Contextual memory could not be loaded."),
    };
  }
}

export async function resetMemory(userId: string): Promise<MemoryStoreResponse> {
  try {
    if (!userId) return { success: false, error: "Authentication is required." };
    await resetMemoryStore(userId);
    return { success: true, memories: [] };
  } catch (error) {
    console.error("Memory reset error:", error);
    return {
      success: false,
      error: getMemoryActionErrorMessage(error, "Contextual memory could not be reset."),
    };
  }
}

export async function prepareMemoryRebuild(
  userId: string,
  count: number
): Promise<MemoryRebuildPreparationResponse> {
  try {
    if (!userId) return { success: false, entries: [], error: "Authentication is required." };
    const normalizedCount = normalizeMemoryRebuildCount(count);
    if (normalizedCount === null) {
      return { success: false, entries: [], error: "Enter a valid number of entries to rebuild." };
    }

    const entries = await getNewestEntriesForReplay(userId, normalizedCount);
    await resetMemoryStore(userId);
    return {
      success: true,
      entries: entries.map((entry) => ({ analysisId: entry.id, createdAt: entry.createdAt })),
    };
  } catch (error) {
    console.error("Memory rebuild preparation error:", error);
    return {
      success: false,
      entries: [],
      error: getMemoryActionErrorMessage(error, "Contextual memory rebuild could not be prepared."),
    };
  }
}

export async function rebuildMemoryEntry(
  analysisId: string,
  userId: string,
  modelId?: string
): Promise<MemoryRebuildEntryResponse> {
  try {
    if (!analysisId || !userId) {
      return { success: false, error: "A saved journal entry is required." };
    }
    await updateMemoryForSavedAnalysis(analysisId, userId, modelId);
    return { success: true };
  } catch (error) {
    console.error("Memory rebuild entry error:", error);
    const failure = getMemoryRebuildFailure(error);
    return { success: false, failure, error: failure.message };
  }
}

export async function rebuildMemory(
  userId: string,
  count: number,
  modelId?: string
): Promise<MemoryRebuildResponse> {
  try {
    if (!userId) {
      return {
        success: false,
        attempted: 0,
        succeeded: 0,
        skipped: 0,
        total: 0,
        failures: [],
        error: "Authentication is required.",
      };
    }
    const result = await rebuildMemoryStore(userId, count, modelId);
    return { success: true, ...result };
  } catch (error) {
    console.error("Memory rebuild error:", error);
    return {
      success: false,
      attempted: 0,
      succeeded: 0,
      skipped: 0,
      total: 0,
      failures: [],
      error: getMemoryActionErrorMessage(error, "Contextual memory could not be rebuilt."),
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
  providerOverride?: string | null
): Promise<RegenerateImagesResponse> {
  try {
    if (!userId) {
      return { success: false, error: "User must be authenticated to regenerate images." };
    }

    // Fetch the existing analysis (service role bypasses RLS)
    const supabase = getServerSupabase();
    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select("image_prompt, image_paths, image_generation_batches, user_id")
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

    const resolvedSelection = resolveImageGenerationSelection({
      override: providerOverride,
    });
    const currentPaths: string[] = analysis.image_paths || [];
    const requiredCapacity = requiredImageCapacity(resolvedSelection.selection);
    if (currentPaths.length + requiredCapacity > MAX_IMAGES_PER_ANALYSIS) {
      return { success: false, error: `Maximum of ${MAX_IMAGES_PER_ANALYSIS} images reached.` };
    }

    const startIndex = currentPaths.length;
    const result = await executeImageGeneration({
      analysisId,
      userId,
      prompt: analysis.image_prompt,
      startIndex,
      resolvedSelection,
      context: "regeneration",
    });

    const updateResult = await updateAnalysisImageGeneration(
      analysisId,
      result.imagePaths,
      result.batches
    );
    if (!updateResult.success) {
      return {
        ...result,
        uploadError: "Images generated but failed to update database: " + updateResult.error,
      };
    }

    return result;
  } catch (error) {
    console.error("Image regeneration error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to regenerate images.",
    };
  }
}

/**
 * Delete an analysis and its generated images.
 * Requires authenticated userId; ownership is re-verified server-side in
 * deleteAnalysisWithImages (the service role client bypasses RLS).
 */
export async function deleteAnalysis(
  analysisId: string,
  userId: string
): Promise<DeleteAnalysisResponse> {
  try {
    if (!userId) {
      return { success: false, error: "User must be authenticated to delete analysis." };
    }

    if (!analysisId) {
      return { success: false, error: "No analysis specified." };
    }

    const result = await deleteAnalysisWithImages(analysisId, userId);

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: (result.code && DELETE_FAILURE_MESSAGES[result.code]) || "Failed to delete analysis.",
    };
  } catch (error) {
    console.error("Delete analysis error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete analysis.",
    };
  }
}

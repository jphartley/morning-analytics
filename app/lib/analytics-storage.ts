import {
  getServerSupabase,
  AnalysisInsert,
} from "./supabase";
import { ImageGenerationDiagnosticsRecorder } from "./image-generation-diagnostics";
import {
  ImageGenerationBatch,
  parseImageGenerationBatches,
} from "./image-generation-types";
import type { MemoryContextItem } from "./memory-types";

const BUCKET_NAME = "analysis-images";

/**
 * Convert base64 data URL to Buffer
 */
function base64ToBuffer(base64DataUrl: string): { buffer: Buffer; contentType: string } {
  const [header, data] = base64DataUrl.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const contentType = mimeMatch ? mimeMatch[1] : "image/jpeg";
  return {
    buffer: Buffer.from(data, "base64"),
    contentType,
  };
}

function getFileExtension(contentType: string): string {
  if (contentType.includes("png")) {
    return "png";
  }

  return "jpg";
}

/**
 * Upload images to Supabase Storage with retry logic
 * Called from server-side only (generateImages)
 * Returns array of storage paths
 * userId: Used for audit logging and future user-scoped operations
 */
export async function uploadImagesToStorage(
  analysisId: string,
  imageDataUrls: string[],
  userId: string,
  startIndex: number = 0,
  diagnostics?: ImageGenerationDiagnosticsRecorder
): Promise<{ paths: string[]; error?: string }> {
  const supabase = getServerSupabase();
  const paths: string[] = [];
  let hasFailures = false;

  diagnostics?.add("upload", "info", "Uploading generated images to Supabase Storage.", {
    imageCount: imageDataUrls.length,
    startIndex,
  });

  for (let i = 0; i < imageDataUrls.length; i++) {
    const { buffer, contentType } = base64ToBuffer(imageDataUrls[i]);
    const extension = getFileExtension(contentType);
    const path = `${analysisId}/${startIndex + i}.${extension}`;

    // Try upload with one retry
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, buffer, {
          contentType,
          upsert: true,
        });

      if (!error) {
        paths.push(path);
        lastError = null;
        diagnostics?.add("upload", "success", "Uploaded image to Supabase Storage.", {
          index: startIndex + i,
          attempt: attempt + 1,
          contentType,
          bytes: buffer.byteLength,
        });
        break;
      }

      lastError = new Error(error.message);
      if (attempt === 0) {
        console.warn(`Image upload failed, retrying: ${error.message}`);
        diagnostics?.add("upload", "warning", "Image upload failed; retrying once.", {
          index: startIndex + i,
          attempt: attempt + 1,
          error: error.message,
        });
      }
    }

    if (lastError) {
      console.error(`Failed to upload image ${i} after retry:`, lastError);
      diagnostics?.add("upload", "error", "Image upload failed after retry.", {
        index: startIndex + i,
        error: lastError.message,
      });
      hasFailures = true;
    }
  }

  if (hasFailures) {
    diagnostics?.add("upload", "error", "One or more image uploads failed.", {
      uploadedCount: paths.length,
      expectedCount: imageDataUrls.length,
    });
    return {
      paths: [],
      error: "Image upload failed; analysis will be saved without images.",
    };
  }

  diagnostics?.add("upload", "success", "All generated images uploaded to Supabase Storage.", {
    uploadedCount: paths.length,
  });

  return { paths };
}


export type DeleteFailureCode = "not_found" | "forbidden" | "storage_failed" | "db_failed";

/**
 * Union the analysis's recorded image_paths with the objects actually listed under
 * `{analysisId}/` in storage, dedupe, and hard-scope the result to the analysis's own
 * folder. This is the security control that prevents over-deletion across the shared
 * bucket even if `imagePaths` is corrupt or contains foreign paths.
 */
export function resolveDeletionPaths(
  analysisId: string,
  imagePaths: string[] | null | undefined,
  listedNames: string[]
): string[] {
  const prefix = `${analysisId}/`;
  const fromListed = listedNames.map((name) => `${prefix}${name}`);
  const union = new Set([...(imagePaths || []), ...fromListed]);

  return Array.from(union)
    .filter((path) => path.startsWith(prefix))
    .sort();
}

/**
 * Delete an analysis row and its owned storage objects.
 * Ownership (`row.user_id === userId`) is verified before any deletion — the service
 * role client bypasses RLS, so this check is the primary authorization guard.
 * Deletion order is storage-first-then-row: if storage removal fails, the row is left
 * intact so the delete is safe to retry (storage.remove is idempotent).
 */
export async function deleteAnalysisWithImages(
  analysisId: string,
  userId: string
): Promise<{ success: boolean; code?: DeleteFailureCode; error?: string }> {
  const supabase = getServerSupabase();

  const { data: row, error: fetchError } = await supabase
    .from("analyses")
    .select("id, user_id, image_paths")
    .eq("id", analysisId)
    .single();

  if (fetchError || !row) {
    return { success: false, code: "not_found" };
  }

  if (row.user_id !== userId) {
    return { success: false, code: "forbidden" };
  }

  let listedNames: string[] = [];
  const { data: listData, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(analysisId);

  if (listError) {
    // Best-effort sweep only — a missing sweep is recoverable on retry, an aborted
    // delete strands the user. Fall back to the recorded image_paths.
    console.error(`Failed to list storage objects for analysis ${analysisId}:`, listError);
  } else {
    listedNames = (listData || []).map((object) => object.name);
  }

  const paths = resolveDeletionPaths(analysisId, row.image_paths, listedNames);

  if (paths.length > 0) {
    const { error: removeError } = await supabase.storage.from(BUCKET_NAME).remove(paths);
    if (removeError) {
      console.error(`Failed to remove storage objects for analysis ${analysisId}:`, removeError);
      return { success: false, code: "storage_failed" };
    }
  }

  const { error: deleteError } = await supabase
    .from("analyses")
    .delete()
    .eq("id", analysisId);

  if (deleteError) {
    console.error(`Failed to delete analysis row ${analysisId}:`, deleteError);
    return { success: false, code: "db_failed" };
  }

  return { success: true };
}

/**
 * Append new image paths to an existing analysis's image_paths array.
 * Uses service role client (bypasses RLS).
 */
export function appendImageGenerationState(
  currentPaths: string[] | null | undefined,
  currentBatches: unknown,
  newPaths: string[],
  newBatches: ImageGenerationBatch[]
): { imagePaths: string[]; imageGenerationBatches: ImageGenerationBatch[] } {
  return {
    imagePaths: [...(currentPaths || []), ...newPaths],
    imageGenerationBatches: [
      ...parseImageGenerationBatches(currentBatches),
      ...newBatches,
    ],
  };
}

export async function updateAnalysisImageGeneration(
  analysisId: string,
  newPaths: string[],
  newBatches: ImageGenerationBatch[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = getServerSupabase();

  const { data, error: fetchError } = await supabase
    .from("analyses")
    .select("image_paths, image_generation_batches")
    .eq("id", analysisId)
    .single();

  if (fetchError || !data) {
    return { success: false, error: fetchError?.message || "Analysis not found" };
  }

  const updated = appendImageGenerationState(
    data.image_paths,
    data.image_generation_batches,
    newPaths,
    newBatches
  );

  const { error: updateError } = await supabase
    .from("analyses")
    .update({
      image_paths: updated.imagePaths,
      image_generation_batches: updated.imageGenerationBatches,
    })
    .eq("id", analysisId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}


/**
 * Save a complete analysis record (images should already be uploaded)
 * Requires authenticated user_id - passed from client's useAuth() hook
 */
export async function saveAnalysis(
  inputText: string,
  analysisText: string,
  imagePrompt: string | null,
  modelId: string,
  imagePaths: string[],
  analysisId: string | undefined,
  analystPersona: string = "jungian",
  userId: string,
  imageGenerationBatches: ImageGenerationBatch[] = [],
  memoryContext: MemoryContextItem[] = []
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getServerSupabase();

  const insertPayload: AnalysisInsert = {
    user_id: userId, // Always set from authenticated session
    input_text: inputText,
    analysis_text: analysisText,
    image_prompt: imagePrompt,
    model_id: modelId,
    image_paths: imagePaths.length > 0 ? imagePaths : null,
    image_generation_batches: imageGenerationBatches,
    memory_context: memoryContext.length > 0 ? memoryContext : null,
    analyst_persona: analystPersona,
    ...(analysisId ? { id: analysisId } : {}),
  };

  const { data: insertData, error: insertError } = await supabase
    .from("analyses")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insertError || !insertData) {
    console.error("Failed to insert analysis:", insertError);
    return { success: false, error: insertError?.message || "Insert failed" };
  }

  return { success: true, id: insertData.id };
}

/**
 * Get a single analysis by ID with public image URLs
 */

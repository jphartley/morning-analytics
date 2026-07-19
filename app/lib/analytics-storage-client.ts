import { getBrowserSupabase, AnalysisListItem, AnalysisRecord } from "./supabase";
import {
  ImageDisplayGroup,
  imageProviderLabel,
  parseImageGenerationBatches,
} from "./image-generation-types";
import { parseMemoryContext } from "./memory-types";

const BUCKET_NAME = "analysis-images";

function getPublicImageUrls(paths: string[]): string[] {
  if (paths.length === 0) {
    return [];
  }

  const supabase = getBrowserSupabase();

  return paths
    .map((path) => supabase.storage.from(BUCKET_NAME).getPublicUrl(path).data?.publicUrl)
    .filter((url): url is string => Boolean(url));
}

export function buildHistoricalImageGroups(
  analysisId: string,
  imagePrompt: string | null,
  imagePaths: string[],
  rawBatches: unknown,
  resolveUrls: (paths: string[]) => string[]
): ImageDisplayGroup[] {
  const batches = parseImageGenerationBatches(rawBatches);
  if (batches.length > 0) {
    return batches.map((batch) => ({
      id: batch.attemptId,
      provider: batch.provider,
      label: imageProviderLabel(batch.provider),
      prompt: batch.prompt,
      status: batch.status,
      imageUrls: resolveUrls(batch.imagePaths),
      ...(batch.status === "failed"
        ? { error: batch.errorCode
          ? `Generation failed (${batch.errorCode}).`
          : "Generation failed." }
        : {}),
    }));
  }

  const imageUrls = resolveUrls(imagePaths);
  return imageUrls.length > 0
    ? [{
      id: `legacy-${analysisId}`,
      provider: null,
      label: "Generated Images (provider unavailable)",
      prompt: imagePrompt,
      status: "success",
      imageUrls,
    }]
    : [];
}

export async function listAnalyses(): Promise<{
  success: boolean;
  data?: AnalysisListItem[];
  error?: string;
}> {
  try {
    const supabase = getBrowserSupabase();

    const { data, error } = await supabase
      .from("analyses")
      .select("id, created_at, input_text")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to list analyses:", error);
      return { success: false, error: error.message };
    }

    const items: AnalysisListItem[] = (data || []).map((row) => ({
      id: row.id,
      created_at: row.created_at,
      input_preview: row.input_text.slice(0, 100),
    }));

    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to list analyses:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list analyses",
    };
  }
}

export async function getAnalysisById(
  id: string
): Promise<{
  success: boolean;
  data?: AnalysisRecord & {
    imageUrls: string[];
    imageGroups: ImageDisplayGroup[];
  };
  error?: string;
}> {
  try {
    const supabase = getBrowserSupabase();

    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Analysis not found" };
      }
      console.error("Failed to fetch analysis:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Analysis not found" };
    }

    const imagePaths: string[] = data.image_paths || [];
    const imageUrls = getPublicImageUrls(imagePaths);
    const batches = parseImageGenerationBatches(data.image_generation_batches);
    const imageGroups = buildHistoricalImageGroups(
      data.id,
      data.image_prompt || null,
      imagePaths,
      batches,
      getPublicImageUrls
    );

    return {
      success: true,
      data: {
        ...data,
        image_generation_batches: batches,
        memory_context: parseMemoryContext(data.memory_context),
        imageUrls,
        imageGroups,
      },
    };
  } catch (error) {
    console.error("Failed to fetch analysis:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load analysis",
    };
  }
}

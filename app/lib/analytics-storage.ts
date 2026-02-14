import {
  getServerSupabase,
  isSupabaseConfigured,
  AnalysisRecord,
  AnalysisInsert,
  AnalysisListItem,
} from "./supabase";

const BUCKET_NAME = "analysis-images";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

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
 */
export async function uploadImagesToStorage(
  analysisId: string,
  imageDataUrls: string[]
): Promise<{ paths: string[]; error?: string }> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured, skipping image upload");
    return { paths: [] };
  }

  const supabase = getServerSupabase();
  const paths: string[] = [];
  let hasFailures = false;

  for (let i = 0; i < imageDataUrls.length; i++) {
    const { buffer, contentType } = base64ToBuffer(imageDataUrls[i]);
    const extension = getFileExtension(contentType);
    const path = `${analysisId}/${i}.${extension}`;

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
        break;
      }

      lastError = new Error(error.message);
      if (attempt === 0) {
        console.warn(`Image upload failed, retrying: ${error.message}`);
      }
    }

    if (lastError) {
      console.error(`Failed to upload image ${i} after retry:`, lastError);
      hasFailures = true;
    }
  }

  if (hasFailures) {
    return {
      paths: [],
      error: "Image upload failed; analysis will be saved without images.",
    };
  }

  return { paths };
}

/**
 * Get signed URLs for stored images
 */
async function getSignedImageUrls(paths: string[]): Promise<string[]> {
  if (!isSupabaseConfigured() || paths.length === 0) {
    return [];
  }

  const supabase = getServerSupabase();
  const urls: string[] = [];

  for (const path of paths) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, SIGNED_URL_EXPIRY);

    if (error) {
      console.error(`Failed to get signed URL for ${path}:`, error);
      continue;
    }

    if (data?.signedUrl) {
      urls.push(data.signedUrl);
    }
  }

  return urls;
}

/**
 * Save a complete analysis record (images should already be uploaded)
 */
export async function saveAnalysis(
  inputText: string,
  analysisText: string,
  imagePrompt: string | null,
  modelId: string,
  imagePaths: string[],
  analysisId?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase not configured" };
  }

  const supabase = getServerSupabase();

  const insertPayload: AnalysisInsert = {
    input_text: inputText,
    analysis_text: analysisText,
    image_prompt: imagePrompt,
    model_id: modelId,
    image_paths: imagePaths.length > 0 ? imagePaths : null,
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
 * Get a single analysis by ID with signed image URLs
 */
export async function getAnalysisById(
  id: string
): Promise<{ success: boolean; data?: AnalysisRecord & { imageUrls: string[] }; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase not configured" };
  }

  const supabase = getServerSupabase();

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

  // Get signed URLs for images
  const imageUrls = await getSignedImageUrls(data.image_paths || []);

  return {
    success: true,
    data: {
      ...data,
      imageUrls,
    },
  };
}

/**
 * List analyses in reverse chronological order
 * Returns id, created_at, and first 100 chars of input
 */
export async function listAnalyses(): Promise<{
  success: boolean;
  data?: AnalysisListItem[];
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Supabase not configured" };
  }

  const supabase = getServerSupabase();

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
}

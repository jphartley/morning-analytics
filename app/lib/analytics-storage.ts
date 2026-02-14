import {
  getServerSupabase,
  AnalysisInsert,
} from "./supabase";

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
 */
export async function uploadImagesToStorage(
  analysisId: string,
  imageDataUrls: string[]
): Promise<{ paths: string[]; error?: string }> {
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
 * Get a single analysis by ID with public image URLs
 */

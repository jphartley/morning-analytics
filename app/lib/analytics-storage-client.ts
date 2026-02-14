import { getBrowserSupabase, AnalysisListItem, AnalysisRecord } from "./supabase";

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
): Promise<{ success: boolean; data?: AnalysisRecord & { imageUrls: string[] }; error?: string }> {
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

    const imageUrls = getPublicImageUrls(data.image_paths || []);

    return {
      success: true,
      data: {
        ...data,
        imageUrls,
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

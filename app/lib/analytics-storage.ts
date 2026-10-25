import type { AnalysisInsert } from "./supabase";
import type { AuthorizedActor } from "./authorization-types";
import { assertImagePaths, isOwnedImagePath, removeAuthorizedImages } from "./authorized-image-storage";
import { requireResourceId } from "./action-errors";
import { type ImageGenerationBatch, parseImageGenerationBatches } from "./image-generation-types";
import type { MemoryContextItem } from "./memory-types";

export type DeleteFailureCode = "not_found" | "forbidden" | "storage_failed" | "db_failed";

export function resolveDeletionPaths(id: string, paths: string[] | null | undefined, names: string[]): string[] {
  return [...new Set([...(paths || []), ...names.map((name) => `${id}/${name}`)])]
    .filter((path) => isOwnedImagePath(id, path)).sort();
}

export async function deleteAnalysisWithImages(id: string, actor: AuthorizedActor): Promise<{success: boolean; code?: DeleteFailureCode}> {
  requireResourceId(id);
  const {supabase, userId} = actor;
  const {data: row, error} = await supabase.from("analyses").select("id,user_id,image_paths")
    .eq("id", id).eq("user_id", userId).maybeSingle();
  if (error || !row || row.user_id !== userId) return {success:false,code:"not_found"};
  assertImagePaths(id,row.image_paths || []);
  try {
    await removeAuthorizedImages(actor,id,row.image_paths || []);
  } catch {
    return {success:false,code:"storage_failed"};
  }
  const {data: removed, error: deleteError} = await supabase.from("analyses").delete()
    .eq("id",id).eq("user_id",userId).select("id");
  if (deleteError || !removed?.length) return {success:false,code:"db_failed"};
  return {success:true};
}

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
  id: string, newPaths: string[], newBatches: ImageGenerationBatch[], actor: AuthorizedActor
): Promise<{success:boolean; error?:string}> {
  assertImagePaths(id,newPaths);
  newBatches.forEach((batch) => assertImagePaths(id,batch.imagePaths));
  const {supabase,userId} = actor;
  const {data,error} = await supabase.from("analyses").select("image_paths,image_generation_batches")
    .eq("id",id).eq("user_id",userId).maybeSingle();
  if (error || !data) return {success:false,error:"Analysis is unavailable."};
  assertImagePaths(id,data.image_paths || []);
  const updated=appendImageGenerationState(data.image_paths,data.image_generation_batches,newPaths,newBatches);
  const {data: changed,error:updateError}=await supabase.from("analyses").update({
    image_paths:updated.imagePaths,image_generation_batches:updated.imageGenerationBatches,
  }).eq("id",id).eq("user_id",userId).select("id");
  return updateError || !changed?.length ? {success:false,error:"Images could not be saved. Please retry."} : {success:true};
}

export async function saveAnalysis(
  inputText: string, analysisText: string, imagePrompt: string | null, modelId: string,
  imagePaths: string[], analysisId: string | undefined, analystPersona: string,
  actor: AuthorizedActor, imageGenerationBatches: ImageGenerationBatch[] = [], memoryContext: MemoryContextItem[] = []
): Promise<{success:boolean; id?:string; error?:string}> {
  requireResourceId(analysisId);
  assertImagePaths(analysisId,imagePaths);
  const payload: AnalysisInsert = {
    id:analysisId,user_id:actor.userId,input_text:inputText,analysis_text:analysisText,
    image_prompt:imagePrompt,model_id:modelId,image_paths:imagePaths.length ? imagePaths : null,
    image_generation_batches:imageGenerationBatches,memory_context:memoryContext.length ? memoryContext : null,
    analyst_persona:analystPersona,
  };
  const {data,error}=await actor.supabase.from("analyses").insert(payload).select("id").single();
  if (error || !data) return {success:false,error:"Analysis could not be saved. Please retry."};
  return {success:true,id:data.id};
}

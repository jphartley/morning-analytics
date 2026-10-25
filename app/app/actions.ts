"use server";

import { analyzeWithGemini } from "@/lib/gemini";
import { saveAnalysis as saveToStorage, updateAnalysisImageGeneration, deleteAnalysisWithImages } from "@/lib/analytics-storage";
import { requireActor, requireAdministrator, authorizedModel, authorizedMemoryMode, authorizedProviderOverride, authorizedPersona } from "@/lib/server-authorization";
import { ActionError, actionFailure, validateActionInput, requireResourceId, requireText, unavailable, type ActionErrorCode } from "@/lib/action-errors";
import { allocateAnalysisResource, ownedImageResource, recordGeneratedImages, assertImagePaths } from "@/lib/authorized-image-storage";
import type { ImageGenerationDiagnostics } from "@/lib/image-generation-diagnostics";
import { executeImageGeneration } from "@/lib/image-generation-orchestrator";
import { type ImageGenerationBatch, type ProviderResultGroup, requiredImageCapacity, parseImageGenerationBatches } from "@/lib/image-generation-types";
import { resolveImageGenerationSelection } from "@/lib/image-providers/registry";
import { selectMemoryContext, updateMemoryForSavedAnalysis } from "@/lib/memory-service";
import type { MemoryContextItem, MemoryWithEvidence } from "@/lib/memory-types";
import { getNewestEntriesForReplay, listMemoriesWithEvidence, resetMemoryStore } from "@/lib/memory-storage";
import { normalizeMemoryRebuildCount, rebuildMemoryStore, type MemoryRebuildFailure } from "@/lib/memory-rebuild";
import { getMemoryRebuildFailure, type MemoryRebuildFailureDetail } from "@/lib/memory-errors";
import type { SingleAnalysisMemoryMode } from "@/lib/analysis-memory-mode";

// Response types
export interface TextAnalysisResponse {
  success: boolean;
  analysisText?: string;
  imagePrompt?: string;
  memoryContext?: MemoryContextItem[];
  memoryWarning?: string;
  error?: string;
  errorCode?: ActionErrorCode;
}

export interface BlindComparisonOption extends TextAnalysisResponse {
  usesMemory: boolean;
}

export interface BlindComparisonResponse {
  success: boolean;
  withMemory?: BlindComparisonOption;
  withoutMemory?: BlindComparisonOption;
  error?: string;
  errorCode?: ActionErrorCode;
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
  errorCode?: ActionErrorCode;
}

export interface SaveAnalysisResponse {
  success: boolean;
  id?: string;
  error?: string;
  errorCode?: ActionErrorCode;
}

export interface MemoryUpdateResponse {
  success: boolean;
  changedCount?: number;
  error?: string;
  errorCode?: ActionErrorCode;
}

export interface MemoryStoreResponse {
  success: boolean;
  memories?: MemoryWithEvidence[];
  error?: string;
  errorCode?: ActionErrorCode;
}

export interface MemoryRebuildResponse {
  success: boolean;
  attempted: number;
  succeeded: number;
  skipped: number;
  total: number;
  failures: MemoryRebuildFailure[];
  error?: string;
  errorCode?: ActionErrorCode;
}

export interface MemoryRebuildEntryReference {
  analysisId: string;
  createdAt: string;
}

export interface MemoryRebuildPreparationResponse {
  success: boolean;
  entries: MemoryRebuildEntryReference[];
  error?: string;
  errorCode?: ActionErrorCode;
}

export interface MemoryRebuildEntryResponse {
  success: boolean;
  failure?: MemoryRebuildFailureDetail;
  error?: string;
  errorCode?: ActionErrorCode;
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
  errorCode?: ActionErrorCode;
}

export interface DeleteAnalysisResponse {
  success: boolean;
  error?: string;
  errorCode?: ActionErrorCode;
}

export interface AnalyzeInput { journalText: string; modelId?: string; persona?: string; memoryMode?: SingleAnalysisMemoryMode }
export interface GenerateImagesInput { imagePrompt: string; providerOverride?: string | null }
export interface AnalysisInput { analysisId: string; modelId?: string }
export interface RebuildInput { count: number; modelId?: string }
export interface RegenerateInput { analysisId: string; providerOverride?: string | null }
export interface SaveInput {
  inputText: string; analysisText: string; imagePrompt: string | null; modelId?: string;
  imagePaths?: string[]; analysisId?: string; analystPersona?: string;
  imageGenerationBatches?: ImageGenerationBatch[]; memoryContext?: MemoryContextItem[];
}

export async function analyzeText(input: AnalyzeInput): Promise<TextAnalysisResponse> {
  try {
    const actor = await requireActor();
    validateActionInput(input);
    const model = authorizedModel(actor, input.modelId);
    const persona = authorizedPersona(input.persona);
    const mode = authorizedMemoryMode(actor, input.memoryMode);
    requireText(input.journalText, "Please enter some text to analyze.");
    const selected = mode === "with-memory"
      ? await selectMemoryContext(input.journalText, actor, model) : { context: [] as MemoryContextItem[] };
    const result = await analyzeWithGemini(input.journalText, model, persona, selected.context);
    return { success: true, analysisText: result.analysisText, imagePrompt: result.imagePrompt || undefined,
      memoryContext: selected.context, memoryWarning: selected.warning };
  } catch (error) { return actionFailure(error, "Analysis could not be completed. Please retry."); }
}

export async function compareTextAnalyses(input: AnalyzeInput): Promise<BlindComparisonResponse> {
  try {
    const actor = await requireActor();
    requireAdministrator(actor, true);
    validateActionInput(input);
    const model = authorizedModel(actor, input.modelId);
    const persona = authorizedPersona(input.persona);
    requireText(input.journalText, "Please enter some text to analyze.");
    const selected = await selectMemoryContext(input.journalText, actor, model);
    const [withMemory, withoutMemory] = await Promise.all([
      analyzeWithGemini(input.journalText, model, persona, selected.context),
      analyzeWithGemini(input.journalText, model, persona, []),
    ]);
    return { success: true,
      withMemory: { success: true, usesMemory: true, analysisText: withMemory.analysisText,
        imagePrompt: withMemory.imagePrompt || undefined, memoryContext: selected.context, memoryWarning: selected.warning },
      withoutMemory: { success: true, usesMemory: false, analysisText: withoutMemory.analysisText,
        imagePrompt: withoutMemory.imagePrompt || undefined, memoryContext: [] },
    };
  } catch (error) { return actionFailure(error, "Analysis comparison could not be completed."); }
}

export async function generateImages(input: GenerateImagesInput): Promise<ImageGenerationResponse> {
  let analysisId: string | undefined;
  try {
    const actor = await requireActor();
    validateActionInput(input);
    const override = authorizedProviderOverride(actor, input.providerOverride);
    const resolvedSelection = resolveImageGenerationSelection({ override });
    requireText(input.imagePrompt, "No image prompt provided.");
    analysisId = await allocateAnalysisResource(actor);
    const result = await executeImageGeneration({ analysisId, actor, prompt: input.imagePrompt,
      startIndex: 0, resolvedSelection, context: "initial" });
    await recordGeneratedImages(actor, analysisId, result.imagePaths, result.batches, result.success);
    return { ...result, analysisId };
  } catch (error) { return { ...actionFailure(error, "Images could not be generated. Please retry."), analysisId }; }
}

export async function saveAnalysis(input: SaveInput): Promise<SaveAnalysisResponse> {
  try {
    const actor = await requireActor();
    validateActionInput(input);
    const model = authorizedModel(actor, input.modelId);
    const persona = authorizedPersona(input.analystPersona);
    requireText(input.inputText, "Original journal text is required.");
    requireText(input.analysisText, "Analysis text is required.");
    if (input.imagePrompt !== null && typeof input.imagePrompt !== "string") throw new ActionError("invalid-input", "Invalid image prompt.");
    const memory = input.memoryContext ?? [];
    if (!Array.isArray(memory)) throw new ActionError("invalid-input", "Invalid memory context.");
    if (memory.length) requireAdministrator(actor);
    if (!memory.every((item) => item && typeof item.id === "string" && Number.isInteger(item.version)
      && typeof item.title === "string" && typeof item.summary === "string")) {
      throw new ActionError("invalid-input", "Invalid memory context.");
    }
    const requestedPaths = input.imagePaths ?? [];
    const requestedBatches = input.imageGenerationBatches ?? [];
    if (!Array.isArray(requestedPaths) || !Array.isArray(requestedBatches)) unavailable();
    let id = input.analysisId;
    let paths: string[] = [];
    let batches: ImageGenerationBatch[] = [];
    if (id) {
      requireResourceId(id);
      assertImagePaths(id, requestedPaths);
      const resource = await ownedImageResource(actor, id);
      if (resource.state === "legacy") unavailable();
      const trustedBatches = parseImageGenerationBatches(resource.image_generation_batches);
      const suppliedBatches = parseImageGenerationBatches(requestedBatches);
      if (suppliedBatches.length !== requestedBatches.length) unavailable();
      suppliedBatches.forEach((batch) => assertImagePaths(id!, batch.imagePaths));
      if (requestedPaths.some((path) => !resource.image_paths.includes(path))) unavailable();
      if (suppliedBatches.length && JSON.stringify(suppliedBatches) !== JSON.stringify(trustedBatches)) unavailable();
      if (resource.image_paths.length && resource.state !== "complete") unavailable();
      paths = resource.image_paths;
      batches = trustedBatches;
    } else {
      if (requestedPaths.length || requestedBatches.length) unavailable();
      id = await allocateAnalysisResource(actor);
    }
    return await saveToStorage(input.inputText, input.analysisText, input.imagePrompt, model,
      paths, id, persona, actor, batches, memory);
  } catch (error) { return actionFailure(error, "Analysis could not be saved. Please retry."); }
}

export async function updateMemory(input: AnalysisInput): Promise<MemoryUpdateResponse> {
  try {
    const actor = await requireActor();
    requireAdministrator(actor);
    validateActionInput(input);
    requireResourceId(input.analysisId);
    const model = authorizedModel(actor, input.modelId);
    const changedCount = await updateMemoryForSavedAnalysis(input.analysisId, actor, model);
    return { success: true, changedCount };
  } catch (error) { return actionFailure(error, "Analysis saved, but contextual memory could not be updated."); }
}

export async function getMemoryStore(): Promise<MemoryStoreResponse> {
  try {
    const actor = await requireActor();
    requireAdministrator(actor, true);
    return { success: true, memories: await listMemoriesWithEvidence(actor) };
  } catch (error) { return actionFailure(error, "Contextual memory could not be loaded."); }
}

export async function resetMemory(): Promise<MemoryStoreResponse> {
  try {
    const actor = await requireActor();
    requireAdministrator(actor, true);
    await resetMemoryStore(actor);
    return { success: true, memories: [] };
  } catch (error) { return actionFailure(error, "Contextual memory could not be reset."); }
}

export async function prepareMemoryRebuild(input: RebuildInput): Promise<MemoryRebuildPreparationResponse> {
  try {
    const actor = await requireActor();
    requireAdministrator(actor, true);
    validateActionInput(input);
    const count = normalizeMemoryRebuildCount(input.count);
    if (count === null) throw new ActionError("invalid-input", "Enter a valid number of entries to rebuild.");
    const entries = await getNewestEntriesForReplay(actor, count);
    await resetMemoryStore(actor);
    return { success: true, entries: entries.map((entry) => ({ analysisId: entry.id, createdAt: entry.createdAt })) };
  } catch (error) { return { ...actionFailure(error, "Contextual memory rebuild could not be prepared."), entries: [] }; }
}

export async function rebuildMemoryEntry(input: AnalysisInput): Promise<MemoryRebuildEntryResponse> {
  try {
    const actor = await requireActor();
    requireAdministrator(actor, true);
    validateActionInput(input);
    requireResourceId(input.analysisId);
    await updateMemoryForSavedAnalysis(input.analysisId, actor, authorizedModel(actor, input.modelId));
    return { success: true };
  } catch (error) {
    return { ...actionFailure(error, getMemoryRebuildFailure(error).message), failure: getMemoryRebuildFailure(error) };
  }
}

export async function rebuildMemory(input: RebuildInput): Promise<MemoryRebuildResponse> {
  try {
    const actor = await requireActor();
    requireAdministrator(actor, true);
    validateActionInput(input);
    const model = authorizedModel(actor, input.modelId);
    const count = normalizeMemoryRebuildCount(input.count);
    if (count === null) throw new ActionError("invalid-input", "Enter a valid number of entries to rebuild.");
    return { success: true, ...await rebuildMemoryStore(actor, count, model) };
  } catch (error) { return { ...actionFailure(error, "Contextual memory could not be rebuilt."),
    attempted: 0, succeeded: 0, skipped: 0, total: 0, failures: [] }; }
}

export async function regenerateImages(input: RegenerateInput): Promise<RegenerateImagesResponse> {
  try {
    const actor = await requireActor();
    validateActionInput(input);
    requireResourceId(input.analysisId);
    const override = authorizedProviderOverride(actor, input.providerOverride);
    const resolvedSelection = resolveImageGenerationSelection({ override });
    const { data: analysis, error } = await actor.supabase.from("analyses")
      .select("image_prompt,image_paths,user_id").eq("id", input.analysisId).eq("user_id", actor.userId).maybeSingle();
    if (error || !analysis || analysis.user_id !== actor.userId) unavailable();
    requireText(analysis.image_prompt, "This analysis has no image prompt.");
    assertImagePaths(input.analysisId, analysis.image_paths || []);
    await ownedImageResource(actor, input.analysisId);
    const startIndex = (analysis.image_paths || []).length;
    if (startIndex + requiredImageCapacity(resolvedSelection.selection) > 20) throw new ActionError("invalid-input", "Maximum of 20 images reached.");
    const result = await executeImageGeneration({ analysisId: input.analysisId, actor,
      prompt: analysis.image_prompt, startIndex, resolvedSelection, context: "regeneration" });
    const update = await updateAnalysisImageGeneration(input.analysisId, result.imagePaths, result.batches, actor);
    return update.success ? result : { ...result, uploadError: "Images generated but could not be saved. Please retry." };
  } catch (error) { return actionFailure(error, "Images could not be regenerated. Please retry."); }
}

export async function deleteAnalysis(input: { analysisId: string }): Promise<DeleteAnalysisResponse> {
  try {
    const actor = await requireActor();
    validateActionInput(input);
    requireResourceId(input.analysisId);
    const result = await deleteAnalysisWithImages(input.analysisId, actor);
    if (result.success) return { success: true };
    if (result.code === "not_found" || result.code === "forbidden") unavailable();
    return { success: false, error: result.code === "storage_failed"
      ? "Couldn't remove all images — please retry." : "Couldn't finish deleting — please retry." };
  } catch (error) { return actionFailure(error, "Analysis could not be deleted. Please retry."); }
}

import { inferMemoryUpdates, selectRelevantMemoryIds } from "./memory-ai";
import {
  applyMemoryOperations,
  listMemoryCatalog,
  type JournalEntryForMemory,
} from "./memory-storage";
import {
  buildMemorySourceBlocks,
  resolveMemoryInferenceOperations,
} from "./memory-source-blocks";
import { boundMemoryContext, type MemoryContextItem } from "./memory-types";
import { getServerSupabase } from "./supabase";

export interface MemorySelectionResult {
  context: MemoryContextItem[];
  warning?: string;
}

export async function selectMemoryContext(
  journalText: string,
  userId: string,
  modelId?: string
): Promise<MemorySelectionResult> {
  try {
    const catalog = await listMemoryCatalog(userId);
    const rankedIds = await selectRelevantMemoryIds(journalText, catalog, modelId);
    return { context: boundMemoryContext(catalog, rankedIds) };
  } catch (error) {
    console.error("Memory selection failed; continuing without memory:", error);
    return {
      context: [],
      warning: "Contextual memory was unavailable, so this analysis continued without it.",
    };
  }
}

export async function getOwnedJournalEntry(
  analysisId: string,
  userId: string
): Promise<JournalEntryForMemory> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("analyses")
    .select("id, user_id, input_text, created_at")
    .eq("id", analysisId)
    .single();

  if (error || !data || data.user_id !== userId) {
    throw new Error("Analysis is unavailable or not owned by the current user.");
  }

  return { id: data.id, inputText: data.input_text, createdAt: data.created_at };
}

export async function updateMemoryForSavedAnalysis(
  analysisId: string,
  userId: string,
  modelId?: string
): Promise<number> {
  const entry = await getOwnedJournalEntry(analysisId, userId);
  const catalog = await listMemoryCatalog(userId);
  const sourceBlocks = buildMemorySourceBlocks(entry.inputText);
  const inferredOperations = await inferMemoryUpdates(
    sourceBlocks,
    entry.createdAt,
    catalog,
    modelId
  );
  const operations = resolveMemoryInferenceOperations(sourceBlocks, inferredOperations);
  await applyMemoryOperations(
    userId,
    entry.id,
    entry.createdAt,
    entry.inputText,
    operations
  );
  return operations.length;
}

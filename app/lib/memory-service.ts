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
import type { AuthorizedActor } from "./authorization-types";
import { unavailable } from "./action-errors";

export interface MemorySelectionResult {
  context: MemoryContextItem[];
  warning?: string;
}

export async function selectMemoryContext(
  journalText: string,
  actor: AuthorizedActor,
  modelId?: string
): Promise<MemorySelectionResult> {
  try {
    const catalog = await listMemoryCatalog(actor);
    const rankedIds = await selectRelevantMemoryIds(journalText, catalog, modelId);
    return { context: boundMemoryContext(catalog, rankedIds) };
  } catch {
    console.error("Memory selection failed; continuing without memory.");
    return {
      context: [],
      warning: "Contextual memory was unavailable, so this analysis continued without it.",
    };
  }
}

export async function getOwnedJournalEntry(
  analysisId: string,
  actor: AuthorizedActor
): Promise<JournalEntryForMemory> {
  const { supabase, userId } = actor;
  const { data, error } = await supabase
    .from("analyses")
    .select("id, user_id, input_text, created_at")
    .eq("id", analysisId)
    .single();

  if (error || !data || data.user_id !== userId) {
    unavailable();
  }

  return { id: data.id, inputText: data.input_text, createdAt: data.created_at };
}

export async function updateMemoryForSavedAnalysis(
  analysisId: string,
  actor: AuthorizedActor,
  modelId?: string
): Promise<number> {
  const entry = await getOwnedJournalEntry(analysisId, actor);
  const catalog = await listMemoryCatalog(actor);
  const sourceBlocks = buildMemorySourceBlocks(entry.inputText);
  const inferredOperations = await inferMemoryUpdates(
    sourceBlocks,
    entry.createdAt,
    catalog,
    modelId
  );
  const operations = resolveMemoryInferenceOperations(sourceBlocks, inferredOperations);
  await applyMemoryOperations(
    actor,
    entry.id,
    entry.createdAt,
    entry.inputText,
    operations
  );
  return operations.length;
}

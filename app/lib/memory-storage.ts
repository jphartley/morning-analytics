import { getServerSupabase } from "./supabase";
import {
  type MemoryCatalogItem,
  type MemoryEvidence,
  type MemoryRecord,
  type MemoryUpdateOperation,
  type MemoryWithEvidence,
  toMemoryCatalogItem,
} from "./memory-types";

export interface JournalEntryForMemory {
  id: string;
  inputText: string;
  createdAt: string;
}

export function isExactEvidenceBlock(journalText: string, excerpt: string): boolean {
  return excerpt.length > 0 && journalText.includes(excerpt);
}

export function selectNewestEntriesForReplay(
  entriesDescending: JournalEntryForMemory[],
  count: number
): JournalEntryForMemory[] {
  return entriesDescending.slice(0, count).reverse();
}

export async function listMemoryCatalog(userId: string): Promise<MemoryCatalogItem[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("user_id", userId)
    .order("last_observed_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list memory catalog: ${error.message}`);
  }

  return ((data || []) as MemoryRecord[]).map(toMemoryCatalogItem);
}

export async function listMemoriesWithEvidence(userId: string): Promise<MemoryWithEvidence[]> {
  const supabase = getServerSupabase();
  const [{ data: memoryData, error: memoryError }, { data: evidenceData, error: evidenceError }] =
    await Promise.all([
      supabase
        .from("memories")
        .select("*")
        .eq("user_id", userId)
        .order("last_observed_at", { ascending: false }),
      supabase
        .from("memory_evidence")
        .select("*")
        .eq("user_id", userId)
        .order("source_entry_at", { ascending: false }),
    ]);

  if (memoryError) {
    throw new Error(`Failed to list memories: ${memoryError.message}`);
  }
  if (evidenceError) {
    throw new Error(`Failed to list memory evidence: ${evidenceError.message}`);
  }

  const evidenceByMemory = new Map<string, MemoryEvidence[]>();
  for (const evidence of (evidenceData || []) as MemoryEvidence[]) {
    const existing = evidenceByMemory.get(evidence.memory_id) || [];
    existing.push(evidence);
    evidenceByMemory.set(evidence.memory_id, existing);
  }

  return ((memoryData || []) as MemoryRecord[]).map((memory) => ({
    ...memory,
    evidence: evidenceByMemory.get(memory.id) || [],
  }));
}

async function assertOwnedAnalysis(analysisId: string, userId: string): Promise<void> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("analyses")
    .select("id, user_id")
    .eq("id", analysisId)
    .single();

  if (error || !data || data.user_id !== userId) {
    throw new Error("Analysis is unavailable or not owned by the current user.");
  }
}

async function insertEvidence(
  memoryId: string,
  userId: string,
  analysisId: string,
  entryDate: string,
  operation: MemoryUpdateOperation
): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase.from("memory_evidence").insert({
    memory_id: memoryId,
    user_id: userId,
    source_analysis_id: analysisId,
    source_entry_at: entryDate,
    excerpt: operation.evidence.excerpt,
    effect: operation.evidence.effect,
  });

  if (error) {
    throw new Error(`Failed to store memory evidence: ${error.message}`);
  }
}

export async function applyMemoryOperations(
  userId: string,
  analysisId: string,
  entryDate: string,
  journalText: string,
  operations: MemoryUpdateOperation[]
): Promise<MemoryRecord[]> {
  await assertOwnedAnalysis(analysisId, userId);
  for (const operation of operations) {
    if (!isExactEvidenceBlock(journalText, operation.evidence.excerpt)) {
      throw new Error("Memory evidence was not an exact source block from the original journal entry.");
    }
  }

  const supabase = getServerSupabase();
  const updateIds = operations
    .filter((operation): operation is Extract<MemoryUpdateOperation, { action: "update" }> =>
      operation.action === "update"
    )
    .map((operation) => operation.memoryId);

  if (new Set(updateIds).size !== updateIds.length) {
    throw new Error("A memory can be updated at most once per journal entry.");
  }

  const existingById = new Map<string, MemoryRecord>();
  if (updateIds.length > 0) {
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("user_id", userId)
      .in("id", updateIds);
    if (error) {
      throw new Error(`Failed to validate memory ownership: ${error.message}`);
    }
    for (const memory of (data || []) as MemoryRecord[]) {
      existingById.set(memory.id, memory);
    }
    if (existingById.size !== new Set(updateIds).size) {
      throw new Error("A memory update referenced an unavailable or differently owned record.");
    }
  }

  const changed: MemoryRecord[] = [];
  for (const operation of operations) {
    const common = {
      user_id: userId,
      title: operation.title,
      summary: operation.summary,
      retrieval_terms: operation.retrievalTerms,
      confidence: operation.confidence,
      significance: operation.significance,
      temporal_status: operation.temporalStatus,
      last_observed_at: entryDate,
      updated_at: new Date().toISOString(),
    };

    let memory: MemoryRecord;
    if (operation.action === "create") {
      const { data, error } = await supabase
        .from("memories")
        .insert({
          ...common,
          first_observed_at: entryDate,
          version: 1,
        })
        .select("*")
        .single();
      if (error || !data) {
        throw new Error(`Failed to create memory: ${error?.message || "No row returned"}`);
      }
      memory = data as MemoryRecord;
    } else {
      const current = existingById.get(operation.memoryId)!;
      const { data, error } = await supabase
        .from("memories")
        .update({ ...common, version: current.version + 1 })
        .eq("id", operation.memoryId)
        .eq("user_id", userId)
        .select("*")
        .single();
      if (error || !data) {
        throw new Error(`Failed to update memory: ${error?.message || "No row returned"}`);
      }
      memory = data as MemoryRecord;
    }

    await insertEvidence(memory.id, userId, analysisId, entryDate, operation);
    changed.push(memory);
  }

  return changed;
}

export async function resetMemoryStore(userId: string): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase.from("memories").delete().eq("user_id", userId);
  if (error) {
    throw new Error(`Failed to reset memory store: ${error.message}`);
  }
}

export async function getNewestEntriesForReplay(
  userId: string,
  count: number
): Promise<JournalEntryForMemory[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("analyses")
    .select("id, input_text, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(count);

  if (error) {
    throw new Error(`Failed to load journal history for rebuild: ${error.message}`);
  }

  const descending = (data || []).map((row) => ({
    id: row.id,
    inputText: row.input_text,
    createdAt: row.created_at,
  }));
  return selectNewestEntriesForReplay(descending, count);
}

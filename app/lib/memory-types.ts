export const MEMORY_TEMPORAL_STATUSES = ["active", "inactive", "uncertain"] as const;
export type MemoryTemporalStatus = (typeof MEMORY_TEMPORAL_STATUSES)[number];

export const MEMORY_EVIDENCE_EFFECTS = ["supports", "revises", "conflicts"] as const;
export type MemoryEvidenceEffect = (typeof MEMORY_EVIDENCE_EFFECTS)[number];

export const MAX_SELECTED_MEMORIES = 5;
export const MAX_MEMORY_CONTEXT_WORDS = 150;
export const MAX_MEMORY_TITLE_LENGTH = 120;
export const MAX_MEMORY_SUMMARY_LENGTH = 500;
export const MAX_MEMORY_EVIDENCE_LENGTH = 800;
export const MAX_MEMORY_RETRIEVAL_TERMS = 20;
export const MAX_MEMORY_RETRIEVAL_TERM_LENGTH = 80;

export interface MemoryRecord {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  retrieval_terms: string[];
  confidence: number;
  significance: number;
  temporal_status: MemoryTemporalStatus;
  version: number;
  first_observed_at: string;
  last_observed_at: string;
  created_at: string;
  updated_at: string;
}

export interface MemoryCatalogItem {
  id: string;
  title: string;
  summary: string;
  retrievalTerms: string[];
  confidence: number;
  significance: number;
  temporalStatus: MemoryTemporalStatus;
  version: number;
  firstObservedAt: string;
  lastObservedAt: string;
}

export interface MemoryEvidence {
  id: string;
  memory_id: string;
  user_id: string;
  source_analysis_id: string | null;
  source_entry_at: string;
  excerpt: string;
  effect: MemoryEvidenceEffect;
  created_at: string;
}

export interface MemoryWithEvidence extends MemoryRecord {
  evidence: MemoryEvidence[];
}

export interface MemoryContextItem {
  id: string;
  version: number;
  title: string;
  summary: string;
}

export interface MemorySelectionOutput {
  memoryIds: string[];
}

export interface MemoryEvidenceInput {
  excerpt: string;
  effect: MemoryEvidenceEffect;
}

export interface MemoryEvidenceReference {
  blockId: string;
  effect: MemoryEvidenceEffect;
}

interface MemoryOperationFields {
  title: string;
  summary: string;
  retrievalTerms: string[];
  confidence: number;
  significance: number;
  temporalStatus: MemoryTemporalStatus;
  evidence: MemoryEvidenceInput;
}

export interface CreateMemoryOperation extends MemoryOperationFields {
  action: "create";
}

export interface UpdateMemoryOperation extends MemoryOperationFields {
  action: "update";
  memoryId: string;
}

export type MemoryUpdateOperation = CreateMemoryOperation | UpdateMemoryOperation;

interface MemoryInferenceFields extends Omit<MemoryOperationFields, "evidence"> {
  evidence: MemoryEvidenceReference;
}

export interface CreateMemoryInferenceOperation extends MemoryInferenceFields {
  action: "create";
}

export interface UpdateMemoryInferenceOperation extends MemoryInferenceFields {
  action: "update";
  memoryId: string;
}

export type MemoryInferenceOperation =
  | CreateMemoryInferenceOperation
  | UpdateMemoryInferenceOperation;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteUnit(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isTemporalStatus(value: unknown): value is MemoryTemporalStatus {
  return typeof value === "string" && MEMORY_TEMPORAL_STATUSES.includes(value as MemoryTemporalStatus);
}

function isEvidenceEffect(value: unknown): value is MemoryEvidenceEffect {
  return typeof value === "string" && MEMORY_EVIDENCE_EFFECTS.includes(value as MemoryEvidenceEffect);
}

function parseRetrievalTerms(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_MEMORY_RETRIEVAL_TERMS) {
    return null;
  }

  const terms = value.map((term) => typeof term === "string" ? term.trim() : "");
  if (terms.some((term) => !term || term.length > MAX_MEMORY_RETRIEVAL_TERM_LENGTH)) {
    return null;
  }

  return Array.from(new Set(terms));
}

export function parseMemorySelectionOutput(value: unknown): MemorySelectionOutput | null {
  if (!isObject(value) || !Array.isArray(value.memoryIds)) {
    return null;
  }

  const memoryIds = value.memoryIds.filter((id): id is string =>
    typeof id === "string" && UUID_PATTERN.test(id)
  );

  if (memoryIds.length !== value.memoryIds.length) {
    return null;
  }

  return { memoryIds: Array.from(new Set(memoryIds)) };
}

export function parseMemoryContext(value: unknown): MemoryContextItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const parsed: MemoryContextItem[] = [];
  for (const item of value.slice(0, MAX_SELECTED_MEMORIES)) {
    if (
      !isObject(item)
      || typeof item.id !== "string"
      || !UUID_PATTERN.test(item.id)
      || typeof item.version !== "number"
      || !Number.isInteger(item.version)
      || item.version < 1
      || !isNonEmptyString(item.title, MAX_MEMORY_TITLE_LENGTH)
      || !isNonEmptyString(item.summary, MAX_MEMORY_SUMMARY_LENGTH)
    ) {
      continue;
    }

    parsed.push({
      id: item.id,
      version: item.version,
      title: item.title.trim(),
      summary: item.summary.trim(),
    });
  }
  return parsed;
}

function parseMemoryInferenceFields(raw: Record<string, unknown>): MemoryInferenceFields | null {
  const retrievalTerms = parseRetrievalTerms(raw.retrievalTerms);
  const evidence = raw.evidence;
  if (
    !isNonEmptyString(raw.title, MAX_MEMORY_TITLE_LENGTH)
    || !isNonEmptyString(raw.summary, MAX_MEMORY_SUMMARY_LENGTH)
    || retrievalTerms === null
    || !isFiniteUnit(raw.confidence)
    || !isFiniteUnit(raw.significance)
    || !isTemporalStatus(raw.temporalStatus)
    || !isObject(evidence)
    || typeof evidence.blockId !== "string"
    || !/^b[1-9]\d*$/.test(evidence.blockId)
    || !isEvidenceEffect(evidence.effect)
  ) {
    return null;
  }

  return {
    title: raw.title.trim(),
    summary: raw.summary.trim(),
    retrievalTerms,
    confidence: raw.confidence,
    significance: raw.significance,
    temporalStatus: raw.temporalStatus,
    evidence: {
      blockId: evidence.blockId,
      effect: evidence.effect,
    },
  };
}

export function parseMemoryInferenceOutput(value: unknown): MemoryInferenceOperation[] | null {
  if (!isObject(value) || !Array.isArray(value.creates) || !Array.isArray(value.updates)) {
    return null;
  }

  const operations: MemoryInferenceOperation[] = [];
  for (const raw of value.creates) {
    if (!isObject(raw)) return null;
    const fields = parseMemoryInferenceFields(raw);
    if (!fields || "memoryId" in raw) return null;
    operations.push({ action: "create", ...fields });
  }

  for (const raw of value.updates) {
    if (!isObject(raw)) return null;
    const fields = parseMemoryInferenceFields(raw);
    if (!fields || typeof raw.memoryId !== "string" || !UUID_PATTERN.test(raw.memoryId)) {
      return null;
    }
    operations.push({ action: "update", memoryId: raw.memoryId, ...fields });
  }

  return operations;
}

export function toMemoryCatalogItem(record: MemoryRecord): MemoryCatalogItem {
  return {
    id: record.id,
    title: record.title,
    summary: record.summary,
    retrievalTerms: record.retrieval_terms,
    confidence: record.confidence,
    significance: record.significance,
    temporalStatus: record.temporal_status,
    version: record.version,
    firstObservedAt: record.first_observed_at,
    lastObservedAt: record.last_observed_at,
  };
}

export function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export function boundMemoryContext(
  catalog: MemoryCatalogItem[],
  rankedIds: string[]
): MemoryContextItem[] {
  const byId = new Map(catalog.map((memory) => [memory.id, memory]));
  const result: MemoryContextItem[] = [];
  let totalWords = 0;

  for (const id of rankedIds) {
    if (result.length >= MAX_SELECTED_MEMORIES) break;
    const memory = byId.get(id);
    if (!memory || result.some((item) => item.id === id)) continue;
    const words = countWords(`${memory.title} ${memory.summary}`);
    if (totalWords + words > MAX_MEMORY_CONTEXT_WORDS) continue;

    result.push({
      id: memory.id,
      version: memory.version,
      title: memory.title,
      summary: memory.summary,
    });
    totalWords += words;
  }

  return result;
}

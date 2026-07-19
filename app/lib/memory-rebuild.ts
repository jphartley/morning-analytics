import { getNewestEntriesForReplay, resetMemoryStore } from "./memory-storage";
import { updateMemoryForSavedAnalysis } from "./memory-service";
import {
  getMemoryRebuildFailure,
  type MemoryRebuildFailureCode,
} from "./memory-errors";

export const DEFAULT_MEMORY_REBUILD_COUNT = 7;
export const MAX_MEMORY_REBUILD_COUNT = 50;

export class MemoryRebuildError extends Error {
  constructor(
    message: string,
    public readonly processed: number,
    public readonly total: number
  ) {
    super(message);
    this.name = "MemoryRebuildError";
  }
}

export interface MemoryRebuildFailure {
  analysisId: string;
  createdAt: string;
  code: MemoryRebuildFailureCode;
  message: string;
}

export interface MemoryRebuildResult {
  attempted: number;
  succeeded: number;
  skipped: number;
  total: number;
  failures: MemoryRebuildFailure[];
}

export function normalizeMemoryRebuildCount(value: number): number | null {
  return Number.isInteger(value) && value >= 1 && value <= MAX_MEMORY_REBUILD_COUNT
    ? value
    : null;
}

export async function rebuildMemoryStore(
  userId: string,
  count: number,
  modelId?: string,
  onProgress?: (attempted: number, succeeded: number, total: number) => void
): Promise<MemoryRebuildResult> {
  const normalizedCount = normalizeMemoryRebuildCount(count);
  if (normalizedCount === null) {
    throw new MemoryRebuildError(
      `Rebuild count must be between 1 and ${MAX_MEMORY_REBUILD_COUNT}.`,
      0,
      0
    );
  }

  const entries = await getNewestEntriesForReplay(userId, normalizedCount);
  await resetMemoryStore(userId);
  let attempted = 0;
  let succeeded = 0;
  const failures: MemoryRebuildFailure[] = [];
  for (const entry of entries) {
    try {
      await updateMemoryForSavedAnalysis(entry.id, userId, modelId);
      succeeded += 1;
    } catch (error) {
      failures.push({
        analysisId: entry.id,
        createdAt: entry.createdAt,
        ...getMemoryRebuildFailure(error),
      });
    }
    attempted += 1;
    onProgress?.(attempted, succeeded, entries.length);
  }

  return {
    attempted,
    succeeded,
    skipped: failures.length,
    total: entries.length,
    failures,
  };
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMemoryStore,
  prepareMemoryRebuild,
  rebuildMemoryEntry,
  resetMemory,
} from "@/app/actions";
import type { MemoryContextItem, MemoryEvidence, MemoryWithEvidence } from "@/lib/memory-types";
import type { MemoryRebuildFailure } from "@/lib/memory-rebuild";
import {
  DEFAULT_MEMORY_REBUILD_COUNT,
  MAX_MEMORY_REBUILD_COUNT,
  normalizeMemoryRebuildCount,
} from "@/lib/memory-rebuild";

interface MemoryDiagnosticsDrawerProps {
  userId: string;
  modelId: string;
  usedMemoryContext: MemoryContextItem[];
}

function formatMemoryDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function MemoryEvidenceDisclosure({ evidence }: { evidence: MemoryEvidence }) {
  return (
    <details className="rounded-md border border-outline px-3 py-2">
      <summary className="cursor-pointer text-sm text-ink">{formatMemoryDate(evidence.source_entry_at)}</summary>
      <blockquote className="mt-2 border-l-2 border-outline pl-3 text-sm text-ink-muted">
        “{evidence.excerpt}”
        <footer className="mt-1 text-xs capitalize">{evidence.effect}</footer>
      </blockquote>
    </details>
  );
}

export function MemoryRebuildBugReport({
  failures,
  modelId,
}: {
  failures: MemoryRebuildFailure[];
  modelId: string;
}) {
  if (failures.length === 0) return null;

  return (
    <details open className="mt-3 rounded-md border border-outline bg-page p-3">
      <summary className="cursor-pointer text-sm font-medium text-ink">
        Rebuild bug report · {failures.length} skipped
      </summary>
      <p className="mt-2 text-xs text-ink-muted">
        Model: <span className="font-mono">{modelId}</span>. This report omits journal text and can be copied when tuning memory inference.
      </p>
      <div className="mt-2 space-y-2">
        {failures.map((failure) => (
          <div key={`${failure.analysisId}-${failure.createdAt}`} className="rounded border border-outline p-2 text-xs">
            <p className="font-medium text-ink">
              {formatMemoryDate(failure.createdAt)} · {failure.code}
            </p>
            <p className="mt-1 text-ink-muted">{failure.message}</p>
            <p className="mt-1 break-all font-mono text-ink-muted">
              Analysis ID: {failure.analysisId}
            </p>
          </div>
        ))}
      </div>
    </details>
  );
}

export function isMemoryUsed(
  memoryId: string,
  version: number,
  context: MemoryContextItem[]
): boolean {
  return context.some((item) => item.id === memoryId && item.version === version);
}

export function MemoryDiagnosticsDrawer({
  userId,
  modelId,
  usedMemoryContext,
}: MemoryDiagnosticsDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [memories, setMemories] = useState<MemoryWithEvidence[]>([]);
  const [rebuildCountInput, setRebuildCountInput] = useState(String(DEFAULT_MEMORY_REBUILD_COUNT));
  const [status, setStatus] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [rebuildFailures, setRebuildFailures] = useState<MemoryRebuildFailure[]>([]);
  const [rebuildProgress, setRebuildProgress] = useState<{
    attempted: number;
    succeeded: number;
    total: number;
    currentDate?: string;
  } | null>(null);

  const usedSnapshotsWithoutCurrentRecord = useMemo(() => {
    const currentIds = new Set(memories.map((memory) => memory.id));
    return usedMemoryContext.filter((item) => !currentIds.has(item.id));
  }, [memories, usedMemoryContext]);

  const loadMemories = async (preserveStatus = false) => {
    const result = await getMemoryStore(userId);
    if (result.success) {
      setMemories(result.memories || []);
      if (!preserveStatus) setStatus(null);
    } else {
      setStatus(result.error || "Contextual memory could not be loaded.");
    }
  };

  useEffect(() => {
    if (isOpen) void loadMemories();
  // Loading is intentionally tied to opening the diagnostic surface.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId]);

  const handleReset = async () => {
    if (!window.confirm("Reset all contextual memories? Journal entries and analyses will remain.")) return;
    setIsWorking(true);
    setRebuildProgress(null);
    setRebuildFailures([]);
    setStatus("Resetting memory...");
    const result = await resetMemory(userId);
    setIsWorking(false);
    if (result.success) {
      setMemories([]);
      setStatus("Memory store reset.");
    } else {
      setStatus(result.error || "Contextual memory could not be reset.");
    }
  };

  const handleRebuild = async () => {
    const rebuildCount = normalizeMemoryRebuildCount(Number(rebuildCountInput));
    if (rebuildCount === null) {
      setStatus(`Enter a whole number from 1 to ${MAX_MEMORY_REBUILD_COUNT}.`);
      return;
    }
    if (!window.confirm(`Reset and rebuild memory from the newest ${rebuildCount} entries?`)) return;
    setIsWorking(true);
    setRebuildFailures([]);
    setRebuildProgress({ attempted: 0, succeeded: 0, total: rebuildCount });
    setStatus(`Preparing the newest ${rebuildCount} entries...`);

    const preparation = await prepareMemoryRebuild(userId, rebuildCount);
    if (!preparation.success) {
      setIsWorking(false);
      setRebuildProgress(null);
      setStatus(preparation.error || "Contextual memory rebuild could not be prepared.");
      return;
    }

    const total = preparation.entries.length;
    setMemories([]);
    setRebuildProgress({ attempted: 0, succeeded: 0, total });
    if (total === 0) {
      setIsWorking(false);
      setStatus("No saved journal entries were available to rebuild.");
      return;
    }

    const failures: MemoryRebuildFailure[] = [];
    let succeeded = 0;
    for (let index = 0; index < total; index += 1) {
      const entry = preparation.entries[index];
      const entryDate = formatMemoryDate(entry.createdAt);
      setRebuildProgress({ attempted: index, succeeded, total, currentDate: entryDate });
      setStatus(`Processing entry ${index + 1} of ${total} · ${entryDate}`);

      const result = await rebuildMemoryEntry(entry.analysisId, userId, modelId);
      if (!result.success) {
        failures.push({
          analysisId: entry.analysisId,
          createdAt: entry.createdAt,
          code: result.failure?.code || "unknown_error",
          message: result.failure?.message || result.error || "Entry failed.",
        });
        setRebuildFailures([...failures]);
      } else {
        succeeded += 1;
      }

      const attempted = index + 1;
      setRebuildProgress({ attempted, succeeded, total });
      setStatus(
        `Attempted ${attempted} of ${total} entries · ${succeeded} succeeded · ${failures.length} skipped.`
      );
      await loadMemories(true);
    }

    setIsWorking(false);
    setStatus(
      failures.length === 0
        ? `Rebuilt memory from ${succeeded} entries.`
        : `Rebuild finished: ${succeeded} succeeded and ${failures.length} skipped out of ${total}.`
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-16 left-4 z-30 rounded-full border border-outline bg-surface px-4 py-2 text-sm font-medium text-ink shadow-lg hover:bg-page"
      >
        Memory diagnostics
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-ink/20" role="dialog" aria-modal="true" aria-label="Memory diagnostics">
          <aside className="h-full w-full max-w-5xl overflow-y-auto border-l border-outline bg-page p-5 shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-ink">Contextual memory</h2>
                <p className="text-sm text-ink-muted">Read-only experimental store</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="text-2xl text-ink-muted" aria-label="Close memory diagnostics">×</button>
            </div>

            <div className="mt-5 rounded-lg border border-outline bg-surface p-4">
              <label className="text-sm font-medium text-ink" htmlFor="memory-rebuild-count">Newest entries to rebuild</label>
              <div className="mt-2 flex gap-2">
                <input
                  id="memory-rebuild-count"
                  type="number"
                  min={1}
                  max={MAX_MEMORY_REBUILD_COUNT}
                  value={rebuildCountInput}
                  disabled={isWorking}
                  onChange={(event) => setRebuildCountInput(event.target.value)}
                  className="w-24 rounded-md border border-outline bg-page px-3 py-2 text-ink"
                />
                <button
                  type="button"
                  disabled={isWorking || normalizeMemoryRebuildCount(Number(rebuildCountInput)) === null}
                  onClick={handleRebuild}
                  className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Rebuild
                </button>
                <button type="button" disabled={isWorking} onClick={handleReset} className="rounded-md border border-outline px-3 py-2 text-sm text-danger disabled:opacity-50">Reset all</button>
              </div>
              {rebuildProgress && (
                <div className="mt-3" aria-live="polite">
                  <div
                    role="progressbar"
                    aria-label="Memory rebuild progress"
                    aria-valuemin={0}
                    aria-valuemax={rebuildProgress.total}
                    aria-valuenow={rebuildProgress.attempted}
                    className="h-2 overflow-hidden rounded-full bg-page"
                  >
                    <div
                      className="h-full rounded-full bg-accent transition-[width] duration-300"
                      style={{
                        width: `${rebuildProgress.total === 0
                          ? 0
                          : (rebuildProgress.attempted / rebuildProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    {rebuildProgress.attempted} of {rebuildProgress.total} attempted
                    {` · ${rebuildProgress.succeeded} succeeded · ${rebuildFailures.length} skipped`}
                    {rebuildProgress.currentDate ? ` · currently processing ${rebuildProgress.currentDate}` : ""}
                  </p>
                </div>
              )}
              {status && <p role="status" className="mt-2 text-sm text-ink-muted">{status}</p>}
              <MemoryRebuildBugReport failures={rebuildFailures} modelId={modelId} />
            </div>

            <div className="mt-5 space-y-3">
              {memories.length === 0 && <p className="text-sm text-ink-muted">No inferred memories yet.</p>}
              {memories.map((memory) => {
                const used = isMemoryUsed(memory.id, memory.version, usedMemoryContext);
                return (
                  <details key={memory.id} className={`rounded-lg border p-4 ${used ? "border-accent bg-accent-soft" : "border-outline bg-surface"}`}>
                    <summary className="cursor-pointer text-sm font-semibold text-ink">
                      {memory.title}{used ? " · Used for this analysis" : ""}
                    </summary>
                    <p className="mt-2 text-sm text-ink">{memory.summary}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-ink-muted">
                      <div><dt>Status</dt><dd className="text-ink">{memory.temporal_status}</dd></div>
                      <div><dt>Version</dt><dd className="text-ink">{memory.version}</dd></div>
                      <div><dt>Confidence</dt><dd className="text-ink">{Math.round(memory.confidence * 100)}%</dd></div>
                      <div><dt>Significance</dt><dd className="text-ink">{Math.round(memory.significance * 100)}%</dd></div>
                      <div className="col-span-2"><dt>Last observed</dt><dd className="text-ink">{formatMemoryDate(memory.last_observed_at)}</dd></div>
                      <div className="col-span-2"><dt>Retrieval terms</dt><dd className="text-ink">{memory.retrieval_terms.join(", ") || "None"}</dd></div>
                    </dl>
                    <div className="mt-4 space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Evidence</h3>
                      {memory.evidence.map((evidence) => (
                        <MemoryEvidenceDisclosure key={evidence.id} evidence={evidence} />
                      ))}
                    </div>
                  </details>
                );
              })}

              {usedSnapshotsWithoutCurrentRecord.map((snapshot) => (
                <div key={`${snapshot.id}-${snapshot.version}`} className="rounded-lg border border-accent bg-accent-soft p-4">
                  <p className="text-sm font-semibold text-ink">{snapshot.title} · Used snapshot</p>
                  <p className="mt-2 text-sm text-ink">{snapshot.summary}</p>
                  <p className="mt-1 text-xs text-ink-muted">Version {snapshot.version}; current record no longer exists.</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

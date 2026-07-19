import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getNewestEntriesForReplay: vi.fn(),
  resetMemoryStore: vi.fn(),
  updateMemoryForSavedAnalysis: vi.fn(),
}));

vi.mock("./memory-storage", () => ({
  getNewestEntriesForReplay: mocks.getNewestEntriesForReplay,
  resetMemoryStore: mocks.resetMemoryStore,
}));
vi.mock("./memory-service", () => ({
  updateMemoryForSavedAnalysis: mocks.updateMemoryForSavedAnalysis,
}));

import {
  MAX_MEMORY_REBUILD_COUNT,
  normalizeMemoryRebuildCount,
  rebuildMemoryStore,
} from "./memory-rebuild";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resetMemoryStore.mockResolvedValue(undefined);
  mocks.updateMemoryForSavedAnalysis.mockResolvedValue(1);
});

describe("memory rebuild", () => {
  it("accepts only positive bounded integer counts", () => {
    expect(normalizeMemoryRebuildCount(7)).toBe(7);
    expect(normalizeMemoryRebuildCount(0)).toBeNull();
    expect(normalizeMemoryRebuildCount(1.5)).toBeNull();
    expect(normalizeMemoryRebuildCount(MAX_MEMORY_REBUILD_COUNT + 1)).toBeNull();
  });

  it("resets once and replays the selected newest window in supplied chronological order", async () => {
    mocks.getNewestEntriesForReplay.mockResolvedValue([
      { id: "oldest-selected", inputText: "one", createdAt: "2026-07-17T08:00:00Z" },
      { id: "middle-selected", inputText: "two", createdAt: "2026-07-18T08:00:00Z" },
      { id: "newest-selected", inputText: "three", createdAt: "2026-07-19T08:00:00Z" },
    ]);

    const progress = vi.fn();
    await expect(rebuildMemoryStore("user-1", 3, "model", progress))
      .resolves.toEqual({
        attempted: 3,
        succeeded: 3,
        skipped: 0,
        total: 3,
        failures: [],
      });

    expect(mocks.getNewestEntriesForReplay).toHaveBeenCalledWith("user-1", 3);
    expect(mocks.resetMemoryStore).toHaveBeenCalledTimes(1);
    expect(mocks.updateMemoryForSavedAnalysis.mock.calls.map((call) => call[0]))
      .toEqual(["oldest-selected", "middle-selected", "newest-selected"]);
    expect(progress).toHaveBeenLastCalledWith(3, 3, 3);
  });

  it("skips failures, continues replay, and returns a detailed report", async () => {
    mocks.getNewestEntriesForReplay.mockResolvedValue([
      { id: "one", inputText: "one", createdAt: "2026-07-18T08:00:00Z" },
      { id: "two", inputText: "two", createdAt: "2026-07-19T08:00:00Z" },
      { id: "three", inputText: "three", createdAt: "2026-07-20T08:00:00Z" },
    ]);
    mocks.updateMemoryForSavedAnalysis
      .mockResolvedValueOnce(1)
      .mockRejectedValueOnce(new Error("Memory updater returned malformed output after one retry."))
      .mockResolvedValueOnce(1);

    await expect(rebuildMemoryStore("user-1", 3)).resolves.toEqual({
      attempted: 3,
      succeeded: 2,
      skipped: 1,
      total: 3,
      failures: [{
        analysisId: "two",
        createdAt: "2026-07-19T08:00:00Z",
        code: "invalid_ai_output",
        message: "Gemini returned memory data in an invalid format after one automatic retry.",
      }],
    });
    expect(mocks.updateMemoryForSavedAnalysis).toHaveBeenCalledTimes(3);
  });
});

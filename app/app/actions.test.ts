import { testActor } from "@/test/actor";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireActor: vi.fn(),
  analyzeWithGemini: vi.fn(),
  executeImageGeneration: vi.fn(),
  getServerSupabase: vi.fn(),
  resolveImageGenerationSelection: vi.fn(),
  updateAnalysisImageGeneration: vi.fn(),
  saveAnalysis: vi.fn(),
  selectMemoryContext: vi.fn(),
  updateMemoryForSavedAnalysis: vi.fn(),
  getNewestEntriesForReplay: vi.fn(),
  listMemoriesWithEvidence: vi.fn(),
  resetMemoryStore: vi.fn(),
}));

vi.mock("@/lib/server-authorization", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/server-authorization")>(), requireActor: mocks.requireActor,
}));
vi.mock("@/lib/authorized-image-storage", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/authorized-image-storage")>(),
  allocateAnalysisResource: vi.fn(async () => "00000000-0000-4000-8000-000000000001"),
  ownedImageResource: vi.fn(async () => ({ state: "complete", image_paths: [], image_generation_batches: [] })),
  recordGeneratedImages: vi.fn(),
}));
vi.mock("uuid", () => ({ v4: vi.fn(() => "analysis-generated") }));
vi.mock("@/lib/gemini", () => ({ analyzeWithGemini: mocks.analyzeWithGemini }));
vi.mock("@/lib/supabase", () => ({
  assertServerSupabaseEnv: vi.fn(),
  getServerSupabase: mocks.getServerSupabase,
}));
vi.mock("@/lib/analytics-storage", () => ({
  saveAnalysis: mocks.saveAnalysis,
  updateAnalysisImageGeneration: mocks.updateAnalysisImageGeneration,
  deleteAnalysisWithImages: vi.fn(),
}));
vi.mock("@/lib/memory-service", () => ({
  selectMemoryContext: mocks.selectMemoryContext,
  updateMemoryForSavedAnalysis: mocks.updateMemoryForSavedAnalysis,
}));
vi.mock("@/lib/memory-storage", () => ({
  getNewestEntriesForReplay: mocks.getNewestEntriesForReplay,
  listMemoriesWithEvidence: mocks.listMemoriesWithEvidence,
  resetMemoryStore: mocks.resetMemoryStore,
}));
vi.mock("@/lib/image-generation-orchestrator", () => ({
  executeImageGeneration: mocks.executeImageGeneration,
}));
vi.mock("@/lib/image-providers/registry", () => ({
  resolveImageGenerationSelection: mocks.resolveImageGenerationSelection,
}));

import {
  analyzeText,
  compareTextAnalyses,
  prepareMemoryRebuild,
  regenerateImages,
  rebuildMemoryEntry,
  saveAnalysis,
  updateMemory,
} from "./actions";

const DUAL_SELECTION = {
  selection: "dual" as const,
  providers: [{ id: "black-forest-labs" }, { id: "midjourney" }],
};
const EXECUTION_RESULT = {
  success: true,
  partial: false,
  groups: [],
  batches: [],
  imageUrls: Array(8).fill("data:image/jpeg;base64,AQ=="),
  imagePaths: Array.from({ length: 8 }, (_, index) => `00000000-0000-4000-8000-000000000123/${index}.jpg`),
  diagnostics: [],
};

function analysisWithPaths(count: number) {
  const query = {
    eq: vi.fn(),
    maybeSingle: vi.fn(async () => ({ data: {
      image_prompt: "A luminous blue lotus",
      image_paths: Array.from({ length: count }, (_, index) => `00000000-0000-4000-8000-000000000123/${index}.jpg`),
      image_generation_batches: [], user_id: "user-123",
    }, error: null })),
  };
  query.eq.mockReturnValue(query);
  mocks.getServerSupabase.mockReturnValue({ from: vi.fn(() => ({ select: () => query })) });
}

beforeEach(() => {
  vi.clearAllMocks();
  analysisWithPaths(0);
  mocks.requireActor.mockImplementation(async () => testActor(mocks.getServerSupabase(), "user-123"));
  vi.stubEnv("NEXT_PUBLIC_TEST_VIEW_ENABLED", "true");
  mocks.resolveImageGenerationSelection.mockReturnValue(DUAL_SELECTION);
  mocks.executeImageGeneration.mockResolvedValue(EXECUTION_RESULT);
  mocks.updateAnalysisImageGeneration.mockResolvedValue({ success: true });
  mocks.selectMemoryContext.mockResolvedValue({ context: [] });
  mocks.analyzeWithGemini.mockResolvedValue({ analysisText: "Analysis", imagePrompt: "Image" });
  mocks.saveAnalysis.mockResolvedValue({ success: true, id: "00000000-0000-4000-8000-000000000001" });
  mocks.updateMemoryForSavedAnalysis.mockResolvedValue(1);
  mocks.getNewestEntriesForReplay.mockResolvedValue([]);
  mocks.listMemoriesWithEvidence.mockResolvedValue([]);
  mocks.resetMemoryStore.mockResolvedValue(undefined);
});

describe("contextual memory orchestration", () => {
  it("selects memory and supplies the bounded snapshot to Gemini", async () => {
    const context = [{
      id: "00000000-0000-4000-8000-000000000001",
      version: 1,
      title: "India holiday",
      summary: "The writer is travelling to India.",
    }];
    mocks.selectMemoryContext.mockResolvedValue({ context });

    const result = await analyzeText({ journalText: "I feel nervous about the holiday.", modelId: "gemini-3.1-pro-preview", persona: "jungian", memoryMode: "with-memory" });

    expect(result).toMatchObject({ success: true, memoryContext: context });
    expect(mocks.analyzeWithGemini).toHaveBeenCalledWith(
      "I feel nervous about the holiday.",
      "gemini-3.1-pro-preview",
      "jungian",
      context
    );
    expect(mocks.selectMemoryContext).toHaveBeenCalledTimes(1);
  });

  it("skips memory selection and returns an empty snapshot in no-memory mode", async () => {
    const result = await analyzeText({ journalText: "I feel nervous about the holiday.", modelId: "gemini-3.1-pro-preview", persona: "jungian", memoryMode: "without-memory" });

    expect(result).toMatchObject({
      success: true,
      memoryContext: [],
    });
    expect(result.memoryWarning).toBeUndefined();
    expect(mocks.selectMemoryContext).not.toHaveBeenCalled();
    expect(mocks.analyzeWithGemini).toHaveBeenCalledWith(
      "I feel nervous about the holiday.",
      "gemini-3.1-pro-preview",
      "jungian",
      []
    );
  });

  it("keeps a normal-user style save memory-free and does not update memory", async () => {
    const result = await analyzeText({ journalText: "A memory-free journal entry.", modelId: "gemini-3.1-pro-preview", persona: "jungian", memoryMode: "without-memory" });

    await saveAnalysis({ inputText: "A memory-free journal entry.", analysisText: result.analysisText || "", imagePrompt: result.imagePrompt || null, modelId: "gemini-3.1-pro-preview", imagePaths: [], analysisId: undefined, analystPersona: "jungian", imageGenerationBatches: [], memoryContext: [] });

    expect(mocks.selectMemoryContext).not.toHaveBeenCalled();
    expect(mocks.saveAnalysis).toHaveBeenCalledWith(
      expect.any(String), expect.any(String), expect.anything(), "gemini-3.1-pro-preview",
      [], expect.any(String), "jungian", expect.objectContaining({userId: "user-123"}), [], []
    );
    expect(mocks.updateMemoryForSavedAnalysis).not.toHaveBeenCalled();
  });

  it("continues without memory and returns a non-blocking selector warning", async () => {
    mocks.selectMemoryContext.mockResolvedValue({
      context: [],
      warning: "Contextual memory was unavailable, so this analysis continued without it.",
    });

    const result = await analyzeText({ journalText: "Today's entry" });

    expect(result.success).toBe(true);
    expect(result.memoryContext).toEqual([]);
    expect(result.memoryWarning).toMatch(/continued without/);
  });

  it("persists the exact memory context and updates memory only through the explicit post-save action", async () => {
    const context = [{
      id: "00000000-0000-4000-8000-000000000001",
      version: 2,
      title: "India holiday",
      summary: "Travel to India is upcoming.",
    }];

    await saveAnalysis({ inputText: "Entry", analysisText: "Analysis", imagePrompt: "Image", modelId: "gemini-3.1-pro-preview", imagePaths: [], analysisId: undefined, analystPersona: "jungian", imageGenerationBatches: [], memoryContext: context });
    expect(mocks.saveAnalysis).toHaveBeenCalledWith(
      "Entry", "Analysis", "Image", "gemini-3.1-pro-preview", [], expect.any(String), "jungian", expect.objectContaining({userId: "user-123"}), [], context
    );
    expect(mocks.updateMemoryForSavedAnalysis).not.toHaveBeenCalled();

    await expect(updateMemory({ analysisId: "00000000-0000-4000-8000-000000000001", modelId: "gemini-3.1-pro-preview" }))
      .resolves.toEqual({ success: true, changedCount: 1 });
    expect(mocks.updateMemoryForSavedAnalysis).toHaveBeenCalledTimes(1);
  });

  it("returns a user-safe memory-update failure without changing the saved result", async () => {
    mocks.updateMemoryForSavedAnalysis.mockRejectedValue(new Error("provider failed"));

    const result = await updateMemory({ analysisId: "00000000-0000-4000-8000-000000000001", modelId: "gemini-3.1-pro-preview" });

    expect(result).toMatchObject({
      success: false,
      error: "Analysis saved, but contextual memory could not be updated.",
    });
  });

  it("selects memory once and generates paired memory-on and memory-off analyses", async () => {
    const context = [{
      id: "00000000-0000-4000-8000-000000000001",
      version: 1,
      title: "India holiday",
      summary: "Upcoming travel to India.",
    }];
    mocks.selectMemoryContext.mockResolvedValue({ context });
    mocks.analyzeWithGemini
      .mockResolvedValueOnce({ analysisText: "With", imagePrompt: "With image" })
      .mockResolvedValueOnce({ analysisText: "Without", imagePrompt: "Without image" });

    const result = await compareTextAnalyses({ journalText: "I am nervous about the holiday.", modelId: "gemini-3.1-pro-preview", persona: "jungian" });

    expect(result.success).toBe(true);
    expect(mocks.selectMemoryContext).toHaveBeenCalledTimes(1);
    expect(mocks.analyzeWithGemini).toHaveBeenNthCalledWith(
      1, "I am nervous about the holiday.", "gemini-3.1-pro-preview", "jungian", context
    );
    expect(mocks.analyzeWithGemini).toHaveBeenNthCalledWith(
      2, "I am nervous about the holiday.", "gemini-3.1-pro-preview", "jungian", []
    );
    expect(result.withMemory).toMatchObject({ usesMemory: true, analysisText: "With" });
    expect(result.withoutMemory).toMatchObject({ usesMemory: false, analysisText: "Without" });
  });

  it("prepares a client-observable rebuild without exposing journal text", async () => {
    mocks.getNewestEntriesForReplay.mockResolvedValue([
      { id: "older", inputText: "private older text", createdAt: "2026-07-18T08:00:00Z" },
      { id: "newer", inputText: "private newer text", createdAt: "2026-07-19T08:00:00Z" },
    ]);

    await expect(prepareMemoryRebuild({ count: 2 })).resolves.toEqual({
      success: true,
      entries: [
        { analysisId: "older", createdAt: "2026-07-18T08:00:00Z" },
        { analysisId: "newer", createdAt: "2026-07-19T08:00:00Z" },
      ],
    });
    expect(mocks.resetMemoryStore).toHaveBeenCalledWith(expect.objectContaining({userId: "user-123"}));
  });

  it("processes one rebuild entry per server action for incremental progress", async () => {
    await expect(rebuildMemoryEntry({ analysisId: "00000000-0000-4000-8000-000000000001", modelId: "gemini-3.1-pro-preview" }))
      .resolves.toEqual({ success: true });
    expect(mocks.updateMemoryForSavedAnalysis)
      .toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001", expect.objectContaining({userId: "user-123"}), "gemini-3.1-pro-preview");
  });

  it("returns a classified journal-text-free failure for a skipped rebuild entry", async () => {
    mocks.updateMemoryForSavedAnalysis.mockRejectedValueOnce(
      new Error("Memory updater returned malformed output after one retry. private journal text")
    );

    const result = await rebuildMemoryEntry({ analysisId: "00000000-0000-4000-8000-000000000001", modelId: "gemini-3.1-pro-preview" });

    expect(result).toMatchObject({
      success: false,
      failure: {
        code: "invalid_ai_output",
        message: "Gemini returned memory data in an invalid format after one automatic retry.",
      },
      error: "Gemini returned memory data in an invalid format after one automatic retry.",
    });
    expect(JSON.stringify(result)).not.toContain("private journal text");
  });
});

describe("regenerateImages dual mode", () => {
  it("persists successful paths and every provider batch together", async () => {
    const result = await regenerateImages({ analysisId: "00000000-0000-4000-8000-000000000123", providerOverride: "dual" });

    expect(result.success).toBe(true);
    expect(mocks.executeImageGeneration).toHaveBeenCalledWith(expect.objectContaining({
      analysisId: "00000000-0000-4000-8000-000000000123",
      prompt: "A luminous blue lotus",
      startIndex: 0,
      resolvedSelection: DUAL_SELECTION,
      context: "regeneration",
    }));
    expect(mocks.updateAnalysisImageGeneration).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000123",
      EXECUTION_RESULT.imagePaths,
      EXECUTION_RESULT.batches,
      expect.objectContaining({userId: "user-123"})
    );
  });

  it("rejects a dual round before provider calls when eight slots do not remain", async () => {
    analysisWithPaths(16);

    const result = await regenerateImages({ analysisId: "00000000-0000-4000-8000-000000000123", providerOverride: "dual" });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Maximum of 20/);
    expect(mocks.executeImageGeneration).not.toHaveBeenCalled();
    expect(mocks.updateAnalysisImageGeneration).not.toHaveBeenCalled();
  });
});

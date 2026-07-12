import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  executeImageGeneration: vi.fn(),
  getServerSupabase: vi.fn(),
  resolveImageGenerationSelection: vi.fn(),
  updateAnalysisImageGeneration: vi.fn(),
}));

vi.mock("uuid", () => ({ v4: vi.fn(() => "analysis-generated") }));
vi.mock("@/lib/gemini", () => ({ analyzeWithGemini: vi.fn() }));
vi.mock("@/lib/supabase", () => ({
  assertServerSupabaseEnv: vi.fn(),
  getServerSupabase: mocks.getServerSupabase,
}));
vi.mock("@/lib/analytics-storage", () => ({
  saveAnalysis: vi.fn(),
  updateAnalysisImageGeneration: mocks.updateAnalysisImageGeneration,
}));
vi.mock("@/lib/image-generation-orchestrator", () => ({
  executeImageGeneration: mocks.executeImageGeneration,
}));
vi.mock("@/lib/image-providers/registry", () => ({
  resolveImageGenerationSelection: mocks.resolveImageGenerationSelection,
}));

import { regenerateImages } from "./actions";

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
  imagePaths: Array.from({ length: 8 }, (_, index) => `analysis-123/${index}.jpg`),
  diagnostics: [],
};

function analysisWithPaths(count: number) {
  mocks.getServerSupabase.mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: {
              image_prompt: "A luminous blue lotus",
              image_paths: Array.from({ length: count }, (_, index) => `analysis-123/${index}.jpg`),
              image_generation_batches: [],
              user_id: "user-123",
            },
            error: null,
          })),
        })),
      })),
    })),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  analysisWithPaths(0);
  mocks.resolveImageGenerationSelection.mockReturnValue(DUAL_SELECTION);
  mocks.executeImageGeneration.mockResolvedValue(EXECUTION_RESULT);
  mocks.updateAnalysisImageGeneration.mockResolvedValue({ success: true });
});

describe("regenerateImages dual mode", () => {
  it("persists successful paths and every provider batch together", async () => {
    const result = await regenerateImages("analysis-123", "user-123", "dual", true);

    expect(result.success).toBe(true);
    expect(mocks.executeImageGeneration).toHaveBeenCalledWith(expect.objectContaining({
      analysisId: "analysis-123",
      prompt: "A luminous blue lotus",
      startIndex: 0,
      resolvedSelection: DUAL_SELECTION,
      context: "regeneration",
    }));
    expect(mocks.updateAnalysisImageGeneration).toHaveBeenCalledWith(
      "analysis-123",
      EXECUTION_RESULT.imagePaths,
      EXECUTION_RESULT.batches
    );
  });

  it("rejects a dual round before provider calls when eight slots do not remain", async () => {
    analysisWithPaths(16);

    const result = await regenerateImages("analysis-123", "user-123", "dual", true);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Maximum of 20/);
    expect(mocks.executeImageGeneration).not.toHaveBeenCalled();
    expect(mocks.updateAnalysisImageGeneration).not.toHaveBeenCalled();
  });
});

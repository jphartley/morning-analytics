import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ImageGenerationBatch } from "@/lib/image-generation-types";

const mocks = vi.hoisted(() => ({
  generateBfl: vi.fn(),
  generateMidjourney: vi.fn(),
  upload: vi.fn(),
  update: vi.fn(),
  getServerSupabase: vi.fn(),
}));

vi.mock("@/lib/image-providers/black-forest-labs", () => ({
  blackForestLabsImageProvider: { id: "black-forest-labs", generateImageSet: mocks.generateBfl },
}));
vi.mock("@/lib/image-providers/midjourney", () => ({
  midjourneyImageProvider: { id: "midjourney", generateImageSet: mocks.generateMidjourney },
}));
vi.mock("@/lib/supabase", () => ({
  assertServerSupabaseEnv: vi.fn(),
  getServerSupabase: mocks.getServerSupabase,
}));
vi.mock("@/lib/analytics-storage", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/analytics-storage")>(),
  uploadImagesToStorage: mocks.upload,
  updateAnalysisImageGeneration: mocks.update,
}));

import { generateImages, regenerateImages } from "./actions";
import { appendImageGenerationState } from "@/lib/analytics-storage";
import { parseImageGenerationBatches } from "@/lib/image-generation-types";

const originalBatch: ImageGenerationBatch = {
  version: 1,
  attemptId: "old-bfl",
  provider: "black-forest-labs",
  model: "flux-2-pro",
  prompt: "Original exact prompt",
  status: "success",
  imagePaths: [0, 1, 2, 3].map((i) => `analysis/${i}.jpg`),
  createdAt: "2026-09-01T10:00:00Z",
};

let stored: ReturnType<typeof appendImageGenerationState>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("IMAGE_GENERATION_PROVIDER", "midjourney");
  vi.stubEnv("IMAGE_PROVIDER_TRIAL_CANDIDATE", "");
  vi.stubEnv("IMAGE_PROVIDER_TEST_OVERRIDE_ENABLED", "true");
  vi.stubEnv("IMAGE_PROVIDER_DUAL_MODE_ENABLED", "true");
  vi.stubEnv("BLACK_FOREST_LABS_API_KEY", "");
  stored = appendImageGenerationState(originalBatch.imagePaths, [originalBatch], [], []);
  mocks.getServerSupabase.mockReturnValue({
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({
      data: {
        user_id: "user", image_prompt: "Current analysis prompt",
        image_paths: stored.imagePaths, image_generation_batches: stored.imageGenerationBatches,
      }, error: null,
    }) }) }) }),
  });
  mocks.generateMidjourney.mockResolvedValue({
    provider: "midjourney", imageDataUrls: Array(4).fill("data:image/jpeg;base64,AQ=="),
  });
  mocks.upload.mockImplementation(async (_id, _images, _user, start) => ({
    paths: [0, 1, 2, 3].map((i) => `analysis/${start + i}.jpg`),
  }));
  mocks.update.mockImplementation(async (_id, paths, batches) => {
    stored = appendImageGenerationState(stored.imagePaths, stored.imageGenerationBatches, paths, batches);
    return { success: true };
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => vi.unstubAllEnvs());

describe("dormancy through real action selection and orchestration", () => {
  it.each(["black-forest-labs", "dual"])("rejects stale %s in initial generation and regeneration without side effects", async (selection) => {
    expect((await generateImages("Prompt", "user", selection)).success).toBe(false);
    expect((await regenerateImages("analysis", "user", selection)).success).toBe(false);
    expect(mocks.generateBfl).not.toHaveBeenCalled();
    expect(mocks.generateMidjourney).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(stored.imageGenerationBatches).toEqual([originalBatch]);
  });

  it("appends Midjourney regeneration to BFL history without changing its provenance", async () => {
    const result = await regenerateImages("analysis", "user");
    expect(result.success).toBe(true);
    expect(mocks.generateBfl).not.toHaveBeenCalled();
    expect(mocks.generateMidjourney).toHaveBeenCalledWith(expect.objectContaining({ prompt: "Current analysis prompt" }));
    expect(stored.imageGenerationBatches[0]).toEqual(originalBatch);
    expect(stored.imageGenerationBatches[1].provider).toBe("midjourney");
    expect(stored.imagePaths).toEqual([0, 1, 2, 3, 4, 5, 6, 7].map((i) => `analysis/${i}.jpg`));
    expect(parseImageGenerationBatches([
      originalBatch,
      { ...originalBatch, attemptId: "failed-bfl", status: "failed", imagePaths: [], errorCode: "timeout" },
      stored.imageGenerationBatches[1],
    ])).toHaveLength(3);
  });

  it("retains the single-provider cap without invoking any provider", async () => {
    stored.imagePaths = Array(17).fill("analysis/old.jpg");
    expect((await regenerateImages("analysis", "user")).error).toMatch(/Maximum of 20/);
    expect(mocks.generateMidjourney).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateImageSet: vi.fn(),
  getServerSupabase: vi.fn(),
  resolveImageProvider: vi.fn(),
  saveToStorage: vi.fn(),
  updateAnalysisImagePaths: vi.fn(),
  uploadImagesToStorage: vi.fn(),
  uuidv4: vi.fn(),
}));

vi.mock("uuid", () => ({
  v4: mocks.uuidv4,
}));

vi.mock("@/lib/gemini", () => ({
  analyzeWithGemini: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  assertServerSupabaseEnv: vi.fn(),
  getServerSupabase: mocks.getServerSupabase,
}));

vi.mock("@/lib/analytics-storage", () => ({
  saveAnalysis: mocks.saveToStorage,
  updateAnalysisImagePaths: mocks.updateAnalysisImagePaths,
  uploadImagesToStorage: mocks.uploadImagesToStorage,
}));

vi.mock("@/lib/image-providers/registry", () => ({
  resolveImageProvider: mocks.resolveImageProvider,
}));

import { regenerateImages } from "./actions";

const GENERATED_IMAGES = [
  "data:image/jpeg;base64,AQ==",
  "data:image/jpeg;base64,Ag==",
  "data:image/jpeg;base64,Aw==",
  "data:image/jpeg;base64,BA==",
];

beforeEach(() => {
  vi.clearAllMocks();

  mocks.getServerSupabase.mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: {
              image_prompt: "A luminous blue lotus",
              image_paths: [],
              user_id: "user-123",
            },
            error: null,
          })),
        })),
      })),
    })),
  });
  mocks.generateImageSet.mockResolvedValue({
    provider: "black-forest-labs",
    imageDataUrls: GENERATED_IMAGES,
  });
  mocks.resolveImageProvider.mockReturnValue({
    id: "black-forest-labs",
    provider: { generateImageSet: mocks.generateImageSet },
    source: "deployment-default",
  });
  mocks.uploadImagesToStorage.mockImplementation(
    async (analysisId: string, _images: string[], _userId: string, startIndex: number) => ({
      paths: GENERATED_IMAGES.map((_, index) => `${analysisId}/${startIndex + index}.jpg`),
    })
  );
  mocks.updateAnalysisImagePaths.mockResolvedValue({ success: true });
});

describe("regenerateImages attempt identity", () => {
  it("uses a fresh provider and diagnostic attempt ID for every round", async () => {
    mocks.uuidv4
      .mockReturnValueOnce("attempt-round-one")
      .mockReturnValueOnce("attempt-round-two");

    const first = await regenerateImages("analysis-123", "user-123");
    const second = await regenerateImages("analysis-123", "user-123");

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(first.diagnostics?.attemptId).toBe("attempt-round-one");
    expect(second.diagnostics?.attemptId).toBe("attempt-round-two");
    expect(mocks.generateImageSet).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ attemptId: "attempt-round-one" })
    );
    expect(mocks.generateImageSet).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ attemptId: "attempt-round-two" })
    );
    expect(mocks.uploadImagesToStorage).toHaveBeenNthCalledWith(
      1,
      "analysis-123",
      GENERATED_IMAGES,
      "user-123",
      0,
      expect.objectContaining({ attemptId: "attempt-round-one" })
    );
    expect(mocks.uploadImagesToStorage).toHaveBeenNthCalledWith(
      2,
      "analysis-123",
      GENERATED_IMAGES,
      "user-123",
      0,
      expect.objectContaining({ attemptId: "attempt-round-two" })
    );
  });
});

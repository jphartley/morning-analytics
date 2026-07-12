import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImageProviderError } from "./image-providers/types";
import type { ImageProvider } from "./image-providers/types";

const mocks = vi.hoisted(() => ({
  uploadImagesToStorage: vi.fn(),
  uuidv4: vi.fn(),
}));

vi.mock("uuid", () => ({ v4: mocks.uuidv4 }));
vi.mock("./analytics-storage", () => ({
  uploadImagesToStorage: mocks.uploadImagesToStorage,
}));

import { executeImageGeneration } from "./image-generation-orchestrator";
import type { ResolvedImageGenerationSelection } from "./image-providers/registry";

const IMAGES = ["a", "b", "c", "d"].map((value) => `data:image/jpeg;base64,${value}`);

function selection(
  bfl: ImageProvider["generateImageSet"],
  midjourney?: ImageProvider["generateImageSet"]
): ResolvedImageGenerationSelection {
  const providers: ResolvedImageGenerationSelection["providers"] = [{
    id: "black-forest-labs",
    source: "test-override",
    provider: { id: "black-forest-labs", generateImageSet: bfl },
  }];
  if (midjourney) {
    providers.push({
      id: "midjourney",
      source: "test-override",
      provider: { id: "midjourney", generateImageSet: midjourney },
    });
  }
  return { selection: midjourney ? "dual" : "black-forest-labs", providers };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.uuidv4.mockReturnValueOnce("attempt-bfl").mockReturnValueOnce("attempt-midjourney");
  mocks.uploadImagesToStorage.mockImplementation(
    async (analysisId: string, _images: string[], _userId: string, startIndex: number) => ({
      paths: IMAGES.map((_, index) => `${analysisId}/${startIndex + index}.jpg`),
    })
  );
});

describe("image generation orchestration", () => {
  it("runs both providers sequentially with the identical prompt and distinct attempts", async () => {
    const calls: string[] = [];
    const bfl = vi.fn(async () => {
      calls.push("black-forest-labs");
      return { provider: "black-forest-labs" as const, model: "flux-2-pro", imageDataUrls: IMAGES };
    });
    const midjourney = vi.fn(async () => {
      calls.push("midjourney");
      return { provider: "midjourney" as const, imageDataUrls: IMAGES };
    });

    const result = await executeImageGeneration({
      analysisId: "analysis-1",
      userId: "user-1",
      prompt: "one shared prompt",
      startIndex: 0,
      resolvedSelection: selection(bfl, midjourney),
      context: "initial",
    });

    expect(result.success).toBe(true);
    expect(result.partial).toBe(false);
    expect(calls).toEqual(["black-forest-labs", "midjourney"]);
    expect(result.groups.map((group) => group.provider)).toEqual([
      "black-forest-labs",
      "midjourney",
    ]);
    expect(result.groups.map((group) => group.attemptId)).toEqual([
      "attempt-bfl",
      "attempt-midjourney",
    ]);
    expect(bfl).toHaveBeenCalledWith(expect.objectContaining({
      prompt: "one shared prompt",
      attemptId: "attempt-bfl",
    }));
    expect(midjourney).toHaveBeenCalledWith(expect.objectContaining({
      prompt: "one shared prompt",
      attemptId: "attempt-midjourney",
    }));
    expect(mocks.uploadImagesToStorage).toHaveBeenNthCalledWith(
      2,
      "analysis-1",
      IMAGES,
      "user-1",
      4,
      expect.anything()
    );
    expect(result.imagePaths).toHaveLength(8);
    expect(result.batches.map((batch) => batch.prompt)).toEqual([
      "one shared prompt",
      "one shared prompt",
    ]);
  });

  it.each([
    ["black-forest-labs", true, false],
    ["midjourney", false, true],
  ])("keeps the successful group when %s fails", async (_name, failBfl, failMidjourney) => {
    const provider = (id: "black-forest-labs" | "midjourney", fail: boolean) => vi.fn(async () => {
      if (fail) throw new ImageProviderError("timeout", `${id} timed out`);
      return { provider: id, imageDataUrls: IMAGES };
    });

    const result = await executeImageGeneration({
      analysisId: "analysis-1",
      userId: "user-1",
      prompt: "shared",
      startIndex: 0,
      resolvedSelection: selection(
        provider("black-forest-labs", failBfl),
        provider("midjourney", failMidjourney)
      ),
      context: "initial",
    });

    expect(result.success).toBe(true);
    expect(result.partial).toBe(true);
    expect(result.groups.map((group) => group.status)).toEqual(
      failBfl ? ["failed", "success"] : ["success", "failed"]
    );
    expect(result.imagePaths).toHaveLength(4);
    expect(result.batches).toHaveLength(2);
  });

  it("reports both failures and does not add an implicit provider for single mode", async () => {
    const failed = vi.fn(async () => {
      throw new ImageProviderError("unavailable", "provider unavailable");
    });
    const result = await executeImageGeneration({
      analysisId: "analysis-1",
      userId: "user-1",
      prompt: "shared",
      startIndex: 0,
      resolvedSelection: selection(failed),
      context: "initial",
    });

    expect(result.success).toBe(false);
    expect(result.groups).toHaveLength(1);
    expect(failed).toHaveBeenCalledTimes(1);
    expect(mocks.uploadImagesToStorage).not.toHaveBeenCalled();
  });

  it("returns both provider outcomes when a dual request fully fails", async () => {
    const failed = () => vi.fn(async () => {
      throw new ImageProviderError("unavailable", "provider unavailable");
    });
    const result = await executeImageGeneration({
      analysisId: "analysis-1",
      userId: "user-1",
      prompt: "shared",
      startIndex: 0,
      resolvedSelection: selection(failed(), failed()),
      context: "initial",
    });

    expect(result.success).toBe(false);
    expect(result.partial).toBe(false);
    expect(result.groups.map((group) => group.status)).toEqual(["failed", "failed"]);
    expect(result.diagnostics).toHaveLength(2);
    expect(result.batches).toHaveLength(2);
  });
});

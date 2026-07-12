import { describe, expect, it } from "vitest";
import { appendImageGenerationState } from "./analytics-storage";
import {
  ImageGenerationBatch,
  parseImageGenerationBatches,
} from "./image-generation-types";

function batch(
  attemptId: string,
  provider: ImageGenerationBatch["provider"],
  prompt: string,
  status: ImageGenerationBatch["status"] = "success"
): ImageGenerationBatch {
  return {
    version: 1,
    attemptId,
    provider,
    model: provider === "black-forest-labs" ? "flux-2-pro" : null,
    prompt,
    status,
    imagePaths: status === "success"
      ? [0, 1, 2, 3].map((index) => `analysis/${attemptId}-${index}.jpg`)
      : [],
    createdAt: "2026-07-12T09:00:00.000Z",
    ...(status === "failed" ? { errorCode: "timeout" as const } : {}),
  };
}

describe("image generation batch storage", () => {
  it("validates successful and failed batches", () => {
    const values = [
      batch("bfl-1", "black-forest-labs", "same prompt"),
      batch("mj-1", "midjourney", "same prompt", "failed"),
    ];

    expect(parseImageGenerationBatches(values)).toEqual(values);
  });

  it("preserves dual ordering and repeated provider prompts", () => {
    const initial = [
      batch("bfl-1", "black-forest-labs", "prompt one"),
      batch("mj-1", "midjourney", "prompt one"),
    ];
    const later = batch("bfl-2", "black-forest-labs", "prompt two");
    const result = appendImageGenerationState(
      initial.flatMap((value) => value.imagePaths),
      initial,
      later.imagePaths,
      [later]
    );

    expect(result.imageGenerationBatches.map((value) => value.attemptId)).toEqual([
      "bfl-1",
      "mj-1",
      "bfl-2",
    ]);
    expect(result.imageGenerationBatches[0].prompt).toBe("prompt one");
    expect(result.imageGenerationBatches[2].prompt).toBe("prompt two");
    expect(result.imagePaths).toHaveLength(12);
  });

  it("ignores malformed batches and supports legacy records", () => {
    expect(parseImageGenerationBatches({ invalid: true })).toEqual([]);
    expect(parseImageGenerationBatches([
      { ...batch("bad", "mock", "prompt"), imagePaths: ["only-one.jpg"] },
    ])).toEqual([]);

    expect(appendImageGenerationState(["legacy/0.jpg"], null, [], [])).toEqual({
      imagePaths: ["legacy/0.jpg"],
      imageGenerationBatches: [],
    });
  });
});

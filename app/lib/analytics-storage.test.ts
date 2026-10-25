import { beforeEach, describe, expect, it, vi } from "vitest";
import { testActor } from "@/test/actor";
import { type ImageGenerationBatch, parseImageGenerationBatches } from "./image-generation-types";
const mocks = vi.hoisted(() => ({ remove: vi.fn() }));
vi.mock("./authorized-image-storage", async (importOriginal) => ({
  ...await importOriginal<typeof import("./authorized-image-storage")>(), removeAuthorizedImages: mocks.remove,
}));
import { appendImageGenerationState, deleteAnalysisWithImages, resolveDeletionPaths } from "./analytics-storage";
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

describe("resolveDeletionPaths", () => {
  it("unions and dedupes image_paths with listed storage object names", () => {
    const result = resolveDeletionPaths(
      "analysis-1",
      ["analysis-1/0.jpg", "analysis-1/1.jpg"],
      ["1.jpg", "2.jpg"]
    );

    expect(result).toEqual(["analysis-1/0.jpg", "analysis-1/1.jpg", "analysis-1/2.jpg"]);
  });

  it("scopes the removal set to the analysis's own prefix, dropping foreign paths", () => {
    const result = resolveDeletionPaths(
      "analysis-1",
      ["analysis-1/0.jpg", "other-analysis/0.jpg"],
      []
    );

    expect(result).toEqual(["analysis-1/0.jpg"]);
  });

  it("returns an empty array for empty inputs", () => {
    expect(resolveDeletionPaths("analysis-1", null, [])).toEqual([]);
    expect(resolveDeletionPaths("analysis-1", undefined, [])).toEqual([]);
  });
});

describe("authorized analysis deletion", () => {
  const id = "00000000-0000-4000-8000-000000000001";
  beforeEach(() => { vi.resetAllMocks(); mocks.remove.mockResolvedValue(undefined); });
  function fixture(owner: string | null, failedDelete = false) {
    const fetch = { eq: vi.fn(), maybeSingle: vi.fn(async () => ({ data: owner ? { id, user_id: owner, image_paths: [`${id}/0.jpg`] } : null, error: null })) };
    fetch.eq.mockReturnValue(fetch);
    const mutation = { eq: vi.fn(), select: vi.fn(async () => ({ data: failedDelete ? null : [{ id }], error: failedDelete ? { message: "unavailable" } : null })) };
    mutation.eq.mockReturnValue(mutation);
    const removeRow = vi.fn(() => mutation);
    const from = vi.fn(() => ({ select: () => fetch, delete: removeRow }));
    return { actor: testActor({ from }, "owner"), removeRow, mutation };
  }
  it("removes only authorized images before deleting the owner's row", async () => {
    const f=fixture("owner");
    expect(await deleteAnalysisWithImages(id,f.actor)).toEqual({success:true});
    expect(mocks.remove).toHaveBeenCalledWith(f.actor,id,[`${id}/0.jpg`]);
    expect(mocks.remove.mock.invocationCallOrder[0]).toBeLessThan(f.removeRow.mock.invocationCallOrder[0]);
    expect(f.mutation.eq).toHaveBeenCalledWith("user_id","owner");
  });
  it.each([null,"another-owner"])("makes missing and foreign rows indistinguishable without storage side effects", async owner => {
    const f=fixture(owner);
    expect(await deleteAnalysisWithImages(id,f.actor)).toEqual({success:false,code:"not_found"});
    expect(mocks.remove).not.toHaveBeenCalled();expect(f.removeRow).not.toHaveBeenCalled();
  });
  it("keeps the row available when image cleanup fails", async () => {
    const f=fixture("owner");mocks.remove.mockRejectedValue(new Error("storage unavailable"));
    expect(await deleteAnalysisWithImages(id,f.actor)).toEqual({success:false,code:"storage_failed"});
    expect(f.removeRow).not.toHaveBeenCalled();
  });
  it("reports a failed row deletion after successful cleanup", async () => {
    const f=fixture("owner",true);
    expect(await deleteAnalysisWithImages(id,f.actor)).toEqual({success:false,code:"db_failed"});
    expect(mocks.remove).toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ImageGenerationBatch,
  parseImageGenerationBatches,
} from "./image-generation-types";

const mocks = vi.hoisted(() => ({
  getServerSupabase: vi.fn(),
}));

vi.mock("./supabase", () => ({
  getServerSupabase: mocks.getServerSupabase,
}));

import {
  appendImageGenerationState,
  deleteAnalysisWithImages,
  resolveDeletionPaths,
} from "./analytics-storage";

interface SupabaseMockOptions {
  fetchResult?: { data: unknown; error: unknown };
  listResult?: { data: unknown; error: unknown };
  removeResult?: { error: unknown };
  deleteResult?: { error: unknown };
}

function buildSupabaseMock(options: SupabaseMockOptions = {}) {
  const single = vi.fn(async () => options.fetchResult ?? { data: null, error: null });
  const deleteEq = vi.fn(async () => options.deleteResult ?? { error: null });
  const list = vi.fn(async () => options.listResult ?? { data: [], error: null });
  const remove = vi.fn(async () => options.removeResult ?? { error: null });

  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({ single })),
    })),
    delete: vi.fn(() => ({
      eq: deleteEq,
    })),
  }));

  const storageFrom = vi.fn(() => ({ list, remove }));

  return {
    client: { from, storage: { from: storageFrom } },
    single,
    deleteEq,
    list,
    remove,
  };
}

function ownedRow(imagePaths: string[] | null = ["analysis-1/0.jpg", "analysis-1/1.jpg"]) {
  return {
    fetchResult: {
      data: { id: "analysis-1", user_id: "owner-1", image_paths: imagePaths },
      error: null,
    },
  };
}

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

describe("deleteAnalysisWithImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Scenario: Server deletes DB record and owned storage objects — owner match removes storage then deletes the row", async () => {
    const mock = buildSupabaseMock(ownedRow(["analysis-1/0.jpg", "analysis-1/1.jpg"]));
    mocks.getServerSupabase.mockReturnValue(mock.client);

    const result = await deleteAnalysisWithImages("analysis-1", "owner-1");

    expect(result).toEqual({ success: true });
    expect(mock.remove).toHaveBeenCalledWith(["analysis-1/0.jpg", "analysis-1/1.jpg"]);
    expect(mock.deleteEq).toHaveBeenCalledWith("id", "analysis-1");
  });

  it("Scenario: A user cannot delete another user's analysis — wrong owner deletes nothing", async () => {
    const mock = buildSupabaseMock({
      fetchResult: {
        data: { id: "analysis-1", user_id: "owner-1", image_paths: ["analysis-1/0.jpg"] },
        error: null,
      },
    });
    mocks.getServerSupabase.mockReturnValue(mock.client);

    const result = await deleteAnalysisWithImages("analysis-1", "someone-else");

    expect(result).toEqual({ success: false, code: "forbidden" });
    expect(mock.remove).not.toHaveBeenCalled();
    expect(mock.deleteEq).not.toHaveBeenCalled();
  });

  it("returns not_found and deletes nothing when the row is missing", async () => {
    const mock = buildSupabaseMock({ fetchResult: { data: null, error: { message: "no rows" } } });
    mocks.getServerSupabase.mockReturnValue(mock.client);

    const result = await deleteAnalysisWithImages("missing-analysis", "owner-1");

    expect(result).toEqual({ success: false, code: "not_found" });
    expect(mock.remove).not.toHaveBeenCalled();
    expect(mock.deleteEq).not.toHaveBeenCalled();
  });

  it("Scenario: Partial storage failure is reported and retry-safe — storage remove error leaves the row intact", async () => {
    const mock = buildSupabaseMock({
      ...ownedRow(["analysis-1/0.jpg"]),
      removeResult: { error: { message: "storage unavailable" } },
    });
    mocks.getServerSupabase.mockReturnValue(mock.client);

    const result = await deleteAnalysisWithImages("analysis-1", "owner-1");

    expect(result).toEqual({ success: false, code: "storage_failed" });
    expect(mock.remove).toHaveBeenCalled();
    expect(mock.deleteEq).not.toHaveBeenCalled();
  });

  it("reports db_failed when the row delete errors after storage is already clean", async () => {
    const mock = buildSupabaseMock({
      ...ownedRow(["analysis-1/0.jpg"]),
      deleteResult: { error: { message: "db unavailable" } },
    });
    mocks.getServerSupabase.mockReturnValue(mock.client);

    const result = await deleteAnalysisWithImages("analysis-1", "owner-1");

    expect(result).toEqual({ success: false, code: "db_failed" });
    expect(mock.remove).toHaveBeenCalled();
  });

  it("falls back to image_paths (without aborting) when the storage list sweep errors", async () => {
    const mock = buildSupabaseMock({
      ...ownedRow(["analysis-1/0.jpg"]),
      listResult: { data: null, error: { message: "list unavailable" } },
    });
    mocks.getServerSupabase.mockReturnValue(mock.client);

    const result = await deleteAnalysisWithImages("analysis-1", "owner-1");

    expect(result).toEqual({ success: true });
    expect(mock.remove).toHaveBeenCalledWith(["analysis-1/0.jpg"]);
  });

  it("skips storage.remove entirely when there are no owned objects to delete", async () => {
    const mock = buildSupabaseMock(ownedRow([]));
    mocks.getServerSupabase.mockReturnValue(mock.client);

    const result = await deleteAnalysisWithImages("analysis-1", "owner-1");

    expect(result).toEqual({ success: true });
    expect(mock.remove).not.toHaveBeenCalled();
    expect(mock.deleteEq).toHaveBeenCalled();
  });
});

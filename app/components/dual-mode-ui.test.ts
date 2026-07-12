import { describe, expect, it } from "vitest";
import { getImageProviderOptions } from "./ImageProviderPicker";
import { canRegenerateImages } from "./RegenerateButton";
import { buildHistoricalImageGroups } from "@/lib/analytics-storage-client";
import {
  ImageGenerationBatch,
  flattenDisplayGroupUrls,
  providerResultGroupToDisplayGroup,
} from "@/lib/image-generation-types";

const resolveUrls = (paths: string[]) => paths.map((path) => `https://images.test/${path}`);

function batch(
  attemptId: string,
  provider: ImageGenerationBatch["provider"],
  status: ImageGenerationBatch["status"]
): ImageGenerationBatch {
  return {
    version: 1,
    attemptId,
    provider,
    model: null,
    prompt: "shared prompt",
    status,
    imagePaths: status === "success" ? ["0.jpg", "1.jpg", "2.jpg", "3.jpg"] : [],
    createdAt: "2026-07-12T09:00:00.000Z",
    ...(status === "failed" ? { errorCode: "timeout" } : {}),
  };
}

describe("dual mode UI helpers", () => {
  it("shows Dual mode only when its client flag is enabled", () => {
    expect(getImageProviderOptions(false).map((option) => option.id)).not.toContain("dual");
    expect(getImageProviderOptions(true).at(-1)).toEqual({ id: "dual", label: "Dual mode" });
  });

  it("reserves four slots for single mode and eight for Dual mode", () => {
    expect(canRegenerateImages(16, 20, 4)).toBe(true);
    expect(canRegenerateImages(17, 20, 4)).toBe(false);
    expect(canRegenerateImages(12, 20, 8)).toBe(true);
    expect(canRegenerateImages(16, 20, 8)).toBe(false);
  });

  it("reconstructs ordered provider headings and partial failure from history", () => {
    const groups = buildHistoricalImageGroups(
      "analysis-1",
      "analysis prompt",
      ["0.jpg", "1.jpg", "2.jpg", "3.jpg"],
      [
        batch("bfl", "black-forest-labs", "success"),
        batch("mj", "midjourney", "failed"),
      ],
      resolveUrls
    );

    expect(groups.map((group) => group.label)).toEqual(["Black Forest Labs", "Midjourney"]);
    expect(groups[1].error).toMatch(/timeout/);
    expect(flattenDisplayGroupUrls(groups)).toHaveLength(4);
  });

  it("uses a neutral legacy group without inferring provider attribution", () => {
    const groups = buildHistoricalImageGroups(
      "analysis-legacy",
      "old prompt",
      ["legacy/0.jpg"],
      null,
      resolveUrls
    );

    expect(groups).toEqual([expect.objectContaining({
      provider: null,
      label: "Generated Images (provider unavailable)",
    })]);
  });

  it("preserves group ordering when flattening URLs for lightbox indexing", () => {
    const diagnostics = {
      attemptId: "attempt",
      provider: "black-forest-labs" as const,
      startedAt: "2026-07-12T09:00:00.000Z",
      completedAt: "2026-07-12T09:00:01.000Z",
      status: "success" as const,
      summary: "done",
      events: [],
    };
    const first = providerResultGroupToDisplayGroup({
      attemptId: "first",
      provider: "black-forest-labs",
      model: null,
      prompt: "prompt",
      status: "success",
      imageUrls: ["bfl-0", "bfl-1"],
      imagePaths: ["bfl-0", "bfl-1"],
      diagnostics,
    });
    const second = { ...first, id: "second", label: "Midjourney", imageUrls: ["mj-0"] };

    expect(flattenDisplayGroupUrls([first, second])).toEqual(["bfl-0", "bfl-1", "mj-0"]);
  });
});

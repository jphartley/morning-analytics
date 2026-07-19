import { describe, expect, it } from "vitest";
import {
  MAX_MEMORY_CONTEXT_WORDS,
  MAX_SELECTED_MEMORIES,
  boundMemoryContext,
  countWords,
  parseMemoryContext,
  parseMemorySelectionOutput,
  parseMemoryInferenceOutput,
  type MemoryCatalogItem,
} from "./memory-types";

const IDS = Array.from({ length: 7 }, (_, index) =>
  `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`
);

function catalogItem(index: number, summary = `Context summary ${index}`): MemoryCatalogItem {
  return {
    id: IDS[index],
    title: `Memory ${index}`,
    summary,
    retrievalTerms: [`term-${index}`],
    confidence: 0.7,
    significance: 0.8,
    temporalStatus: "active",
    version: index + 1,
    firstObservedAt: "2026-07-01T08:00:00.000Z",
    lastObservedAt: "2026-07-19T08:00:00.000Z",
  };
}

describe("memory parsers", () => {
  it("parses and deduplicates valid selector identifiers", () => {
    expect(parseMemorySelectionOutput({ memoryIds: [IDS[0], IDS[0], IDS[1]] })).toEqual({
      memoryIds: [IDS[0], IDS[1]],
    });
  });

  it("rejects malformed selector and update output", () => {
    expect(parseMemorySelectionOutput({ memoryIds: ["not-a-uuid"] })).toBeNull();
    expect(parseMemoryInferenceOutput({ operations: [{ action: "delete" }] })).toBeNull();
    expect(parseMemoryInferenceOutput({
      creates: [{
        title: "India holiday",
        summary: "The writer is preparing for a holiday in India.",
        retrievalTerms: ["India", "holiday"],
        confidence: 2,
        significance: 0.9,
        temporalStatus: "active",
        evidence: { blockId: "b1", effect: "supports" },
      }],
      updates: [],
    })).toBeNull();
  });

  it("parses valid create and update operations", () => {
    const parsed = parseMemoryInferenceOutput({
      creates: [{
        title: "India holiday",
        summary: "The writer is preparing for a holiday in India.",
        retrievalTerms: ["India", "holiday"],
        confidence: 0.7,
        significance: 0.8,
        temporalStatus: "active",
        evidence: { blockId: "b1", effect: "supports" },
      }],
      updates: [{
        memoryId: IDS[0],
        title: "Relationship with Tarek",
        summary: "The writer experiences recurring conflict with Tarek.",
        retrievalTerms: ["Tarek", "conflict"],
        confidence: 0.75,
        significance: 0.9,
        temporalStatus: "active",
        evidence: { blockId: "b2", effect: "supports" },
      }],
    });

    expect(parsed).toMatchObject([
      { action: "create", title: "India holiday", evidence: { blockId: "b1" } },
      { action: "update", memoryId: IDS[0], confidence: 0.75, evidence: { blockId: "b2" } },
    ]);
  });

  it("ignores malformed saved snapshots and preserves valid versions", () => {
    expect(parseMemoryContext([
      { id: IDS[0], version: 3, title: "India holiday", summary: "Upcoming travel to India." },
      { id: "bad", version: 0, title: "Bad", summary: "Bad" },
    ])).toEqual([
      { id: IDS[0], version: 3, title: "India holiday", summary: "Upcoming travel to India." },
    ]);
  });
});

describe("boundMemoryContext", () => {
  it("enforces ownership-by-catalog, ranking, deduplication, and the five-memory cap", () => {
    const catalog = IDS.slice(0, 6).map((_, index) => catalogItem(index));
    const result = boundMemoryContext(catalog, ["00000000-0000-4000-8000-999999999999", ...IDS, IDS[0]]);

    expect(result).toHaveLength(MAX_SELECTED_MEMORIES);
    expect(result.map((item) => item.id)).toEqual(IDS.slice(0, 5));
  });

  it("keeps the total title and summary word count within 150 words", () => {
    const longSummary = Array.from({ length: 80 }, () => "context").join(" ");
    const result = boundMemoryContext(
      [catalogItem(0, longSummary), catalogItem(1, longSummary), catalogItem(2, "short context")],
      [IDS[0], IDS[1], IDS[2]]
    );

    expect(countWords(result.map((item) => `${item.title} ${item.summary}`).join(" ")))
      .toBeLessThanOrEqual(MAX_MEMORY_CONTEXT_WORDS);
    expect(result.map((item) => item.id)).toEqual([IDS[0], IDS[2]]);
  });
});

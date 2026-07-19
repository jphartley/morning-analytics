import { describe, expect, it } from "vitest";
import {
  buildMemorySourceBlocks,
  resolveMemoryInferenceOperations,
} from "./memory-source-blocks";

describe("memory source blocks", () => {
  it("creates ordered deterministic blocks whose text is copied exactly from the journal", () => {
    const journal = "First thought. Second thought! Third thought? Fourth thought.\n\nA separate paragraph.";
    const first = buildMemorySourceBlocks(journal);
    const second = buildMemorySourceBlocks(journal);

    expect(first).toEqual(second);
    expect(first.map((block) => block.id)).toEqual(["b1", "b2", "b3"]);
    for (const block of first) {
      expect(journal.slice(block.start, block.end)).toBe(block.text);
      expect(journal).toContain(block.text);
    }
  });

  it("splits long unpunctuated writing without exceeding the evidence limit", () => {
    const journal = Array.from({ length: 250 }, (_, index) => `word${index}`).join(" ");
    const blocks = buildMemorySourceBlocks(journal);

    expect(blocks.length).toBeGreaterThan(1);
    expect(blocks.every((block) => block.text.length <= 720)).toBe(true);
    expect(blocks.every((block) => journal.includes(block.text))).toBe(true);
  });

  it("resolves a selected block ID to exact source evidence", () => {
    const journal = "I am nervous about India. We leave next week.";
    const blocks = buildMemorySourceBlocks(journal);
    const operations = resolveMemoryInferenceOperations(blocks, [{
      action: "create",
      title: "India holiday",
      summary: "The writer is nervous about an upcoming trip to India.",
      retrievalTerms: ["India", "holiday"],
      confidence: 0.7,
      significance: 0.8,
      temporalStatus: "active",
      evidence: { blockId: "b1", effect: "supports" },
    }]);

    expect(operations[0].evidence.excerpt).toBe(blocks[0].text);
  });

  it("rejects a block ID that the server did not supply", () => {
    const blocks = buildMemorySourceBlocks("A journal entry.");
    expect(() => resolveMemoryInferenceOperations(blocks, [{
      action: "create",
      title: "Context",
      summary: "Potentially important context.",
      retrievalTerms: ["context"],
      confidence: 0.5,
      significance: 0.6,
      temporalStatus: "uncertain",
      evidence: { blockId: "b99", effect: "supports" },
    }])).toThrow("unknown source block b99");
  });
});

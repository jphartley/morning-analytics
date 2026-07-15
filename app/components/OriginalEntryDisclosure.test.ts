import { describe, expect, it } from "vitest";
import {
  COLLAPSE_WORD_THRESHOLD,
  countWords,
  getEntryPreview,
  shouldCollapseEntry,
} from "./OriginalEntryDisclosure";

describe("countWords", () => {
  it("returns 0 for an empty string", () => {
    expect(countWords("")).toBe(0);
  });

  it("counts a single word", () => {
    expect(countWords("hello")).toBe(1);
  });

  it("counts multiple words", () => {
    expect(countWords("hello there world")).toBe(3);
  });

  it("ignores extra whitespace, newlines, and tabs", () => {
    expect(countWords("  hello   there  \n\n world \t again  ")).toBe(4);
  });

  it("returns 0 for whitespace-only text", () => {
    expect(countWords("   \n\t  ")).toBe(0);
  });
});

describe("shouldCollapseEntry", () => {
  const wordsOf = (count: number) => Array.from({ length: count }, (_, i) => `word${i}`).join(" ");

  it("does not collapse text below the threshold", () => {
    expect(shouldCollapseEntry(wordsOf(COLLAPSE_WORD_THRESHOLD - 1))).toBe(false);
  });

  it("does not collapse text exactly at the threshold", () => {
    expect(shouldCollapseEntry(wordsOf(COLLAPSE_WORD_THRESHOLD))).toBe(false);
  });

  it("collapses text just above the threshold", () => {
    expect(shouldCollapseEntry(wordsOf(COLLAPSE_WORD_THRESHOLD + 1))).toBe(true);
  });

  it("respects a custom threshold", () => {
    expect(shouldCollapseEntry(wordsOf(5), 4)).toBe(true);
    expect(shouldCollapseEntry(wordsOf(4), 4)).toBe(false);
  });
});

describe("getEntryPreview", () => {
  it("leaves short text unchanged", () => {
    expect(getEntryPreview("Hello world, this is a short entry.")).toBe(
      "Hello world, this is a short entry."
    );
  });

  it("truncates long text with an ellipsis", () => {
    const longLine = "a".repeat(300);
    const preview = getEntryPreview(longLine);
    expect(preview.endsWith("...")).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(243);
  });

  it("respects maxLines, appending an ellipsis when lines are cut off", () => {
    const text = "line one\nline two\nline three\nline four\nline five";
    const preview = getEntryPreview(text, 2, 240);
    expect(preview).toBe("line one line two...");
  });

  it("does not add an ellipsis when content fits within maxLines and maxChars", () => {
    const text = "line one\nline two";
    const preview = getEntryPreview(text, 3, 240);
    expect(preview).toBe("line one line two");
  });

  it("skips blank lines when selecting preview lines", () => {
    const text = "line one\n\n\nline two";
    const preview = getEntryPreview(text, 2, 240);
    expect(preview).toBe("line one line two");
  });
});

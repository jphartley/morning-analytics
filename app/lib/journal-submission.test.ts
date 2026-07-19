import { describe, expect, it } from "vitest";
import {
  countJournalWords,
  shouldAutoAnalyzePastedJournal,
} from "./journal-submission";

function words(count: number): string {
  return Array.from({ length: count }, (_, index) => `word-${index}`).join(" ");
}

describe("journal paste submission", () => {
  it("counts whitespace-separated journal words", () => {
    expect(countJournalWords(" one\n two   three ")).toBe(3);
  });

  it("auto-submits only an enabled paste at or above 300 words", () => {
    expect(shouldAutoAnalyzePastedJournal(words(299), false)).toBe(false);
    expect(shouldAutoAnalyzePastedJournal(words(300), false)).toBe(true);
    expect(shouldAutoAnalyzePastedJournal(words(301), true)).toBe(false);
  });
});

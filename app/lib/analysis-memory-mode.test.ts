import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_ANALYSIS_MEMORY_MODE,
  dispatchAnalysisMemoryMode,
  getEffectiveAnalysisMemoryMode,
  type AnalysisMemoryMode,
} from "./analysis-memory-mode";
import { shouldAutoAnalyzePastedJournal } from "./journal-submission";

describe("analysis memory mode workflow", () => {
  it("defaults to Use memory and forces it outside enabled Test view", () => {
    expect(DEFAULT_ANALYSIS_MEMORY_MODE).toBe("with-memory");
    expect(getEffectiveAnalysisMemoryMode("quiet", true, "blind-comparison"))
      .toBe("with-memory");
    expect(getEffectiveAnalysisMemoryMode("insight", true, "without-memory"))
      .toBe("with-memory");
    expect(getEffectiveAnalysisMemoryMode("test", false, "blind-comparison"))
      .toBe("with-memory");
    expect(getEffectiveAnalysisMemoryMode("test", true, "blind-comparison"))
      .toBe("blind-comparison");
  });

  it.each([
    ["without-memory", "without-memory"],
    ["with-memory", "with-memory"],
  ] as const)("routes Analyze in %s mode to one single analysis", (mode, expected) => {
    const runSingle = vi.fn();
    const runBlindComparison = vi.fn();

    dispatchAnalysisMemoryMode(mode, { runSingle, runBlindComparison });

    expect(runSingle).toHaveBeenCalledWith(expected);
    expect(runBlindComparison).not.toHaveBeenCalled();
  });

  it("routes Analyze in blind mode only to the comparison path", () => {
    const runSingle = vi.fn();
    const runBlindComparison = vi.fn();

    dispatchAnalysisMemoryMode("blind-comparison", {
      runSingle,
      runBlindComparison,
    });

    expect(runSingle).not.toHaveBeenCalled();
    expect(runBlindComparison).toHaveBeenCalledTimes(1);
  });

  it.each([
    "without-memory",
    "with-memory",
    "blind-comparison",
  ] as AnalysisMemoryMode[])("routes a qualifying paste through %s mode", (mode) => {
    const journalText = Array.from({ length: 300 }, () => "word").join(" ");
    const runSingle = vi.fn();
    const runBlindComparison = vi.fn();

    if (shouldAutoAnalyzePastedJournal(journalText, false)) {
      dispatchAnalysisMemoryMode(mode, { runSingle, runBlindComparison });
    }

    if (mode === "blind-comparison") {
      expect(runBlindComparison).toHaveBeenCalledTimes(1);
      expect(runSingle).not.toHaveBeenCalled();
    } else {
      expect(runSingle).toHaveBeenCalledWith(mode);
      expect(runBlindComparison).not.toHaveBeenCalled();
    }
  });
});

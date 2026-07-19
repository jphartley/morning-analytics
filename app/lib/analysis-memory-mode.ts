import type { ViewDensityMode } from "@/lib/top-bar-presets";

export const ANALYSIS_MEMORY_MODES = [
  "without-memory",
  "with-memory",
  "blind-comparison",
] as const;

export type AnalysisMemoryMode = (typeof ANALYSIS_MEMORY_MODES)[number];
export type SingleAnalysisMemoryMode = Exclude<AnalysisMemoryMode, "blind-comparison">;

export const DEFAULT_ANALYSIS_MEMORY_MODE: AnalysisMemoryMode = "with-memory";

export function getEffectiveAnalysisMemoryMode(
  viewMode: ViewDensityMode,
  testViewEnabled: boolean,
  selectedMode: AnalysisMemoryMode
): AnalysisMemoryMode {
  return viewMode === "test" && testViewEnabled
    ? selectedMode
    : DEFAULT_ANALYSIS_MEMORY_MODE;
}

export function dispatchAnalysisMemoryMode<Result>(
  mode: AnalysisMemoryMode,
  handlers: {
    runSingle: (mode: SingleAnalysisMemoryMode) => Result;
    runBlindComparison: () => Result;
  }
): Result {
  return mode === "blind-comparison"
    ? handlers.runBlindComparison()
    : handlers.runSingle(mode);
}

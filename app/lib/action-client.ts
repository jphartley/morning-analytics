"use client";

import * as actions from "@/app/actions";
export type { TextAnalysisResponse, BlindComparisonOption } from "@/app/actions";

function invoke<Args extends unknown[], Result extends { success: boolean; errorCode?: string }>(
  action: (...args: Args) => Promise<Result>
) {
  return async (...args: Args): Promise<Result> => {
    const result = await action(...args);
    if (result.errorCode === "unauthenticated" && typeof window !== "undefined") {
      window.dispatchEvent(new Event("morning-analytics:reauthenticate"));
    }
    return result;
  };
}

export const analyzeText = invoke(actions.analyzeText);
export const compareTextAnalyses = invoke(actions.compareTextAnalyses);
export const generateImages = invoke(actions.generateImages);
export const saveAnalysis = invoke(actions.saveAnalysis);
export const updateMemory = invoke(actions.updateMemory);
export const getMemoryStore = invoke(actions.getMemoryStore);
export const resetMemory = invoke(actions.resetMemory);
export const prepareMemoryRebuild = invoke(actions.prepareMemoryRebuild);
export const rebuildMemoryEntry = invoke(actions.rebuildMemoryEntry);
export const regenerateImages = invoke(actions.regenerateImages);
export const deleteAnalysis = invoke(actions.deleteAnalysis);

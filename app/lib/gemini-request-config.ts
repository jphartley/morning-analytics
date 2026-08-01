import { ThinkingLevel } from "@google/genai";

import type { GeminiModel, GeminiThinkingLevel } from "./models";

function toGenAIThinkingLevel(level: GeminiThinkingLevel): ThinkingLevel {
  switch (level) {
    case "minimal":
      return ThinkingLevel.MINIMAL;
    case "low":
      return ThinkingLevel.LOW;
    case "medium":
      return ThinkingLevel.MEDIUM;
    case "high":
      return ThinkingLevel.HIGH;
  }
}

export function getGeminiThinkingConfig(model: GeminiModel): {
  thinkingConfig?: { thinkingLevel: ThinkingLevel };
} {
  const level = model.thinking?.supported ? model.thinking.level : undefined;

  return level
    ? { thinkingConfig: { thinkingLevel: toGenAIThinkingLevel(level) } }
    : {};
}

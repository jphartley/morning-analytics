export interface GeminiModel {
  id: string;
  displayName: string;
  description: string;
  thinking?: {
    supported: boolean;
    level?: GeminiThinkingLevel;
  };
}

export type GeminiThinkingLevel = "minimal" | "low" | "medium" | "high";

export const GEMINI_MODELS: GeminiModel[] = [
  {
    id: "gemini-3.6-flash",
    displayName: "Gemini 3.6 Flash",
    description: "Strong, efficient analysis",
    thinking: {
      supported: true,
      level: "medium",
    },
  },
  {
    id: "gemini-3.5-flash-lite",
    displayName: "Gemini 3.5 Flash-Lite",
    description: "Fastest, lowest-cost answers",
    thinking: {
      supported: true,
      level: "minimal",
    },
  },
  {
    id: "gemini-3.1-pro-preview",
    displayName: "Gemini 3.1 Pro Preview",
    description: "Most advanced reasoning; default",
    thinking: {
      supported: true,
      level: "high",
    },
  },
];

export const DEFAULT_MODEL_ID = "gemini-3.1-pro-preview";

export function getGeminiModelById(modelId?: string): GeminiModel | null {
  if (!modelId) {
    return null;
  }

  return GEMINI_MODELS.find((model) => model.id === modelId) || null;
}

export function getSupportedGeminiModel(modelId?: string): GeminiModel {
  return getGeminiModelById(modelId) || getGeminiModelById(DEFAULT_MODEL_ID)!;
}

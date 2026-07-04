export interface GeminiModel {
  id: string;
  displayName: string;
  description: string;
  thinking?: {
    supported: boolean;
    level?: "minimal" | "low" | "medium" | "high";
  };
}

export const GEMINI_MODELS: GeminiModel[] = [
  {
    id: "gemini-3.1-flash-lite",
    displayName: "Gemini 3.1 Flash-Lite",
    description: "Fastest answers",
    thinking: {
      supported: false,
    },
  },
  {
    id: "gemini-3.5-flash",
    displayName: "Gemini 3.5 Flash",
    description: "All-around help",
    thinking: {
      supported: true,
      level: "high",
    },
  },
  {
    id: "gemini-3.1-pro-preview",
    displayName: "Gemini 3.1 Pro",
    description: "Advanced analysis and reasoning",
    thinking: {
      supported: true,
      level: "high",
    },
  },
];

export const DEFAULT_MODEL_ID = "gemini-3.5-flash";

export function getGeminiModelById(modelId?: string): GeminiModel | null {
  if (!modelId) {
    return null;
  }

  return GEMINI_MODELS.find((model) => model.id === modelId) || null;
}

export function getSupportedGeminiModel(modelId?: string): GeminiModel {
  return getGeminiModelById(modelId) || getGeminiModelById(DEFAULT_MODEL_ID)!;
}

export interface GeminiModel {
  id: string;
  displayName: string;
  description: string;
}

export const GEMINI_MODELS: GeminiModel[] = [
  {
    id: "gemini-3-pro-preview",
    displayName: "Gemini 3 Pro",
    description: "Deepest reasoning – best insights, slowest",
  },
  {
    id: "gemini-2.5-pro",
    displayName: "Gemini 2.5 Pro",
    description: "High-end reasoning – stable, long context",
  },
  {
    id: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    description: "Balanced – good quality, faster",
  },
];

export const DEFAULT_MODEL_ID = "gemini-3-pro-preview";

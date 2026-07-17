import { DEFAULT_MODEL_ID, GEMINI_MODELS } from "@/lib/models";
import {
  isImageGenerationSelection,
  type ImageGenerationSelection,
} from "@/lib/image-generation-types";
import type { ImageProviderId } from "@/lib/image-providers/types";

export const ANALYST_PERSONAS = [
  {
    id: "jungian",
    displayName: "Jungian Analyst",
    description: "Psychoanalytic depth – symbolic insights, spiritual perspective",
  },
  {
    id: "mel-robbins",
    displayName: "Mel Robbins",
    description: "Action-oriented – bold moves, practical breakthrough",
  },
  {
    id: "loving-parent",
    displayName: "Loving Parent",
    description: "Compassionate – empathetic support, nurturing perspective",
  },
] as const;

export type AnalystPersona = (typeof ANALYST_PERSONAS)[number]["id"];

export const DEFAULT_ANALYST_PERSONA: AnalystPersona = "jungian";

export type ViewDensityMode = "quiet" | "insight" | "test";

export const DEFAULT_VIEW_DENSITY_MODE: ViewDensityMode = "insight";
export const VIEW_DENSITY_MODES: ViewDensityMode[] = ["quiet", "insight", "test"];

export const ANALYST_PERSONA_STORAGE_KEY = "morning-analytics-analyst-persona";
export const MODEL_STORAGE_KEY = "gemini-model";
export const IMAGE_PROVIDER_STORAGE_KEY = "morning-analytics-image-provider";
export const VIEW_DENSITY_STORAGE_KEY = "morning-analytics-view-density";

export interface TopBarPresets {
  analystPersona: AnalystPersona;
  modelId: string;
  imageProvider: ImageGenerationSelection;
  viewDensityMode: ViewDensityMode;
}

function readStoredValue(key: string): string | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // localStorage unavailable (SSR, private browsing, disabled, etc.).
  }

  return null;
}

function writeStoredValue(key: string, value: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Persistence is best-effort; the in-session selection remains usable.
  }
}

export function isAnalystPersona(value: string | null): value is AnalystPersona {
  return ANALYST_PERSONAS.some((persona) => persona.id === value);
}

export function getStoredAnalystPersona(): AnalystPersona {
  const stored = readStoredValue(ANALYST_PERSONA_STORAGE_KEY);
  return isAnalystPersona(stored) ? stored : DEFAULT_ANALYST_PERSONA;
}

export function setStoredAnalystPersona(persona: AnalystPersona): void {
  writeStoredValue(ANALYST_PERSONA_STORAGE_KEY, persona);
}

export function getStoredModel(): string {
  const stored = readStoredValue(MODEL_STORAGE_KEY);
  return stored && GEMINI_MODELS.some((model) => model.id === stored)
    ? stored
    : DEFAULT_MODEL_ID;
}

export function setStoredModel(modelId: string): void {
  writeStoredValue(MODEL_STORAGE_KEY, modelId);
}

export function getStoredImageProvider(
  defaultProvider: ImageProviderId,
  providerOverrideEnabled: boolean,
  dualModeEnabled: boolean
): ImageGenerationSelection {
  if (!providerOverrideEnabled) {
    return defaultProvider;
  }

  const stored = readStoredValue(IMAGE_PROVIDER_STORAGE_KEY);
  if (!stored || !isImageGenerationSelection(stored)) {
    return defaultProvider;
  }

  return stored === "dual" && !dualModeEnabled ? defaultProvider : stored;
}

export function setStoredImageProvider(provider: ImageGenerationSelection): void {
  writeStoredValue(IMAGE_PROVIDER_STORAGE_KEY, provider);
}

export function isViewDensityMode(value: string | null): value is ViewDensityMode {
  return value === "quiet" || value === "insight" || value === "test";
}

export function getStoredViewDensityMode(): ViewDensityMode {
  const stored = readStoredValue(VIEW_DENSITY_STORAGE_KEY);
  return isViewDensityMode(stored) ? stored : DEFAULT_VIEW_DENSITY_MODE;
}

export function setStoredViewDensityMode(mode: ViewDensityMode): void {
  writeStoredValue(VIEW_DENSITY_STORAGE_KEY, mode);
}

export function getStoredTopBarPresets(
  defaultProvider: ImageProviderId,
  providerOverrideEnabled: boolean,
  dualModeEnabled: boolean
): TopBarPresets {
  return {
    analystPersona: getStoredAnalystPersona(),
    modelId: getStoredModel(),
    imageProvider: getStoredImageProvider(
      defaultProvider,
      providerOverrideEnabled,
      dualModeEnabled
    ),
    viewDensityMode: getStoredViewDensityMode(),
  };
}

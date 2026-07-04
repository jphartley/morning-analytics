import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { readFileSync } from "fs";
import { join } from "path";

import { DEFAULT_MODEL_ID, getSupportedGeminiModel } from "./models";

type AppThinkingLevel = NonNullable<
  ReturnType<typeof getSupportedGeminiModel>["thinking"]
>["level"];

export interface AnalysisResult {
  analysisText: string;
  imagePrompt: string | null;
}

const MOCK_DELAY_MS = 2000;

const MOCK_RESPONSE = `Ah, welcome, soul-friend. It sounds as though you're wading through some murky emotional waters today, but within that murkiness, there's a glimmer of something transformative.

**Reflective Analysis:** The essence here is a yearning for unfiltered expression and a release from perceived judgment. Your words carry the weight of someone standing at a threshold, unsure whether to step forward or retreat. **Key Word:** Authenticity.

**Left-Field Insight:** What if the need to defend is simply a call to define? Perhaps the friction you feel isn't opposition, but the universe asking you to articulate who you truly are.

**Follow-Up Prompt:** What would it feel like to create something solely for the joy of it, without any expectation or justification?

---IMAGE PROMPT---

A vibrant watercolor painting in the style of Georgia O'Keeffe, featuring a single, luminous lotus flower blooming from dark, swirling waters. The background incorporates faint, interwoven alchemical symbols, representing transformation and the journey toward purity. Soft morning light filters through mist, creating an ethereal atmosphere of emergence and possibility.`;

function parseResponse(response: string): AnalysisResult {
  const delimiter = "---IMAGE PROMPT---";
  const parts = response.split(delimiter);

  if (parts.length >= 2) {
    return {
      analysisText: parts[0].trim(),
      imagePrompt: parts[1].trim(),
    };
  }

  return {
    analysisText: response.trim(),
    imagePrompt: null,
  };
}

let personaPrompts: { [key: string]: string } | null = null;

function loadPersonaPrompts(): { [key: string]: string } {
  if (!personaPrompts) {
    const personas = ["jungian", "mel-robbins", "loving-parent"];
    personaPrompts = {};

    for (const persona of personas) {
      try {
        const promptPath = join(process.cwd(), "prompts", `${persona}.md`);
        personaPrompts[persona] = readFileSync(promptPath, "utf-8");
        console.log(`[PROMPT] Loaded ${persona} persona prompt`);
      } catch (error) {
        console.error(
          `[ERROR] Failed to load ${persona} persona prompt:`,
          error
        );
        throw new Error(
          `Failed to load ${persona} persona prompt. Check that prompts/${persona}.md exists.`
        );
      }
    }
  }
  return personaPrompts;
}

function getPromptForPersona(persona: string = "jungian"): string {
  const personas = loadPersonaPrompts();

  if (!personas[persona]) {
    console.error(
      `[ERROR] Unknown persona: ${persona}. Falling back to jungian.`
    );
    return personas["jungian"];
  }

  return personas[persona];
}

function toGenAIThinkingLevel(level: AppThinkingLevel): ThinkingLevel {
  switch (level) {
    case "minimal":
      return ThinkingLevel.MINIMAL;
    case "low":
      return ThinkingLevel.LOW;
    case "medium":
      return ThinkingLevel.MEDIUM;
    case "high":
      return ThinkingLevel.HIGH;
    default:
      return ThinkingLevel.THINKING_LEVEL_UNSPECIFIED;
  }
}

export async function analyzeWithGemini(
  journalText: string,
  modelId?: string,
  persona: string = "jungian"
): Promise<AnalysisResult> {
  const useMocks = process.env.USE_AI_MOCKS === "true";

  if (useMocks) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    console.log(
      `[MOCK] Gemini analysis (${persona}) for:`,
      journalText.slice(0, 50) + "..."
    );
    return parseResponse(MOCK_RESPONSE);
  }

  // Real Gemini implementation
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenAI({ apiKey });
  const requestedModelId = modelId || process.env.GEMINI_MODEL || DEFAULT_MODEL_ID;
  const effectiveModel = getSupportedGeminiModel(requestedModelId);

  if (requestedModelId !== effectiveModel.id) {
    console.warn(
      `[GEMINI] Unsupported model "${requestedModelId}". Falling back to ${effectiveModel.id}.`
    );
  }

  const systemPrompt = getPromptForPersona(persona);

  const result = await genAI.models.generateContent({
    model: effectiveModel.id,
    contents: journalText,
    config: {
      systemInstruction: systemPrompt,
      ...(effectiveModel.thinking?.supported && effectiveModel.thinking.level
        ? {
            thinkingConfig: {
              thinkingLevel: toGenAIThinkingLevel(effectiveModel.thinking.level),
            },
          }
        : {}),
    },
  });

  const response = result.text || "";

  return parseResponse(response);
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from "fs";
import { join } from "path";

import { DEFAULT_MODEL_ID } from "./models";

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

let systemPrompt: string | null = null;

function getSystemPrompt(): string {
  if (!systemPrompt) {
    const promptPath = join(process.cwd(), "..", "docs", "prompt.md");
    systemPrompt = readFileSync(promptPath, "utf-8");
  }
  return systemPrompt;
}

export async function analyzeWithGemini(
  journalText: string,
  modelId?: string
): Promise<AnalysisResult> {
  const useMocks = process.env.USE_MOCKS === "true";

  if (useMocks) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    console.log("[MOCK] Gemini analysis for:", journalText.slice(0, 50) + "...");
    return parseResponse(MOCK_RESPONSE);
  }

  // Real Gemini implementation
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const effectiveModelId = modelId || process.env.GEMINI_MODEL || DEFAULT_MODEL_ID;
  const model = genAI.getGenerativeModel({
    model: effectiveModelId,
    systemInstruction: getSystemPrompt(),
  });

  const result = await model.generateContent(journalText);
  const response = result.response.text();

  return parseResponse(response);
}

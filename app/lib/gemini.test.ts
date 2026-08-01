import { afterEach, describe, expect, it, vi } from "vitest";

const aiMocks = vi.hoisted(() => ({ generateContent: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: aiMocks.generateContent };
  },
  ThinkingLevel: {
    MINIMAL: "MINIMAL",
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    THINKING_LEVEL_UNSPECIFIED: "THINKING_LEVEL_UNSPECIFIED",
  },
}));

import { analyzeWithGemini } from "./gemini";

afterEach(() => {
  vi.unstubAllEnvs();
  aiMocks.generateContent.mockReset();
});

describe("Gemini analysis requests", () => {
  it.each([
    ["gemini-3.6-flash", "MEDIUM"],
    ["gemini-3.5-flash-lite", "MINIMAL"],
    ["gemini-3.1-pro-preview", "HIGH"],
  ])("uses the configured thinking level for %s", async (modelId, thinkingLevel) => {
    vi.stubEnv("USE_AI_MOCKS", "false");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    aiMocks.generateContent.mockResolvedValue({
      text: "Analysis\n---IMAGE PROMPT---\nA prompt",
    });

    await expect(analyzeWithGemini("A journal entry", modelId)).resolves.toEqual({
      analysisText: "Analysis",
      imagePrompt: "A prompt",
    });

    const request = aiMocks.generateContent.mock.calls[0][0];
    expect(request.model).toBe(modelId);
    expect(request.config.thinkingConfig).toEqual({ thinkingLevel });
    expect(request.config.thinkingConfig).not.toHaveProperty("includeThoughts");
  });

  it("falls back to the default model for an unsupported request", async () => {
    vi.stubEnv("USE_AI_MOCKS", "false");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    aiMocks.generateContent.mockResolvedValue({ text: "Analysis" });

    await analyzeWithGemini("A journal entry", "gemini-3.5-flash");

    expect(aiMocks.generateContent.mock.calls[0][0].model).toBe("gemini-3.1-pro-preview");
  });
});

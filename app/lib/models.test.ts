import { describe, expect, it } from "vitest";
import { DEFAULT_MODEL_ID, GEMINI_MODELS, getSupportedGeminiModel } from "./models";

describe("Gemini model catalog", () => {
  it("exposes the current three picker models", () => {
    expect(GEMINI_MODELS.map((model) => model.id)).toEqual([
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.1-pro-preview",
    ]);
  });

  it("uses Gemini 3.1 Pro Preview as the default", () => {
    expect(DEFAULT_MODEL_ID).toBe("gemini-3.1-pro-preview");
    expect(getSupportedGeminiModel()).toMatchObject({ id: DEFAULT_MODEL_ID });
  });

  it("falls back from removed model IDs", () => {
    expect(getSupportedGeminiModel("gemini-3.1-flash-lite").id).toBe(DEFAULT_MODEL_ID);
    expect(getSupportedGeminiModel("gemini-3.5-flash").id).toBe(DEFAULT_MODEL_ID);
    expect(getSupportedGeminiModel("unknown-model").id).toBe(DEFAULT_MODEL_ID);
  });
});

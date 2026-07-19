import { afterEach, describe, expect, it, vi } from "vitest";

const aiMocks = vi.hoisted(() => ({ generateContent: vi.fn() }));

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = { generateContent: aiMocks.generateContent };
  },
}));

import { inferMemoryUpdates, selectRelevantMemoryIds } from "./memory-ai";
import { buildMemorySourceBlocks } from "./memory-source-blocks";
import type { MemoryCatalogItem } from "./memory-types";

const MEMORY_ID = "00000000-0000-4000-8000-000000000001";
const catalog: MemoryCatalogItem[] = [{
  id: MEMORY_ID,
  title: "Relationships with Tarek and Bruno",
  summary: "The writer associates recurring difficult dynamics with Tarek and Bruno.",
  retrievalTerms: ["Tarek", "Bruno", "narcissists"],
  confidence: 0.7,
  significance: 0.9,
  temporalStatus: "active",
  version: 2,
  firstObservedAt: "2026-07-01T08:00:00.000Z",
  lastObservedAt: "2026-07-18T08:00:00.000Z",
}];

afterEach(() => {
  vi.unstubAllEnvs();
  aiMocks.generateContent.mockReset();
});

describe("mock memory AI", () => {
  it("fuzzily selects an indirect retrieval association", async () => {
    vi.stubEnv("USE_AI_MOCKS", "true");
    await expect(selectRelevantMemoryIds("The narcissists in my life exhaust me.", catalog))
      .resolves.toEqual([MEMORY_ID]);
  });

  it("returns no selection for unrelated writing", async () => {
    vi.stubEnv("USE_AI_MOCKS", "true");
    await expect(selectRelevantMemoryIds("I enjoyed making coffee this morning.", catalog))
      .resolves.toEqual([]);
  });

  it("returns deterministic block-ID evidence for original writing", async () => {
    vi.stubEnv("USE_AI_MOCKS", "true");
    const journalText = "I am nervous about our holiday in India. We leave next week.";
    const operations = await inferMemoryUpdates(
      buildMemorySourceBlocks(journalText),
      "2026-07-19T08:00:00.000Z",
      []
    );

    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({
      action: "create",
      temporalStatus: "active",
      evidence: { blockId: "b1" },
    });
  });
});

describe("real memory AI structured output", () => {
  it("retries once when Gemini returns an update without a memory ID", async () => {
    vi.stubEnv("USE_AI_MOCKS", "false");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    aiMocks.generateContent
      .mockResolvedValueOnce({ text: JSON.stringify({ creates: [], updates: [{
        title: "Holiday",
        summary: "Upcoming holiday context.",
        retrievalTerms: ["holiday"],
        confidence: 0.8,
        significance: 0.8,
        temporalStatus: "active",
        evidence: { blockId: "b1", effect: "supports" },
      }] }) })
      .mockResolvedValueOnce({ text: JSON.stringify({ creates: [{
        title: "Holiday nerves",
        summary: "The writer feels nervous about an upcoming holiday.",
        retrievalTerms: ["holiday", "nervous"],
        confidence: 0.7,
        significance: 0.8,
        temporalStatus: "active",
        evidence: { blockId: "b1", effect: "supports" },
      }], updates: [] }) });

    await expect(inferMemoryUpdates(
      buildMemorySourceBlocks("I feel nervous about the holiday."),
      "2026-07-15T08:00:00.000Z",
      catalog
    )).resolves.toMatchObject([{ action: "create", title: "Holiday nerves" }]);

    expect(aiMocks.generateContent).toHaveBeenCalledTimes(2);
    expect(aiMocks.generateContent.mock.calls[1][0].config.systemInstruction)
      .toContain("previous response failed strict validation");
  });

  it("sends every source block for one entry together", async () => {
    vi.stubEnv("USE_AI_MOCKS", "false");
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    aiMocks.generateContent.mockResolvedValue({ text: JSON.stringify({ creates: [], updates: [] }) });
    const blocks = buildMemorySourceBlocks("One. Two. Three. Four.");

    await inferMemoryUpdates(blocks, "2026-07-15T08:00:00.000Z", catalog);

    const request = JSON.parse(aiMocks.generateContent.mock.calls[0][0].contents);
    const responseSchema = JSON.stringify(
      aiMocks.generateContent.mock.calls[0][0].config.responseJsonSchema
    );
    expect(request.sourceBlocks).toEqual(blocks.map(({ id, text }) => ({ id, text })));
    expect(request).not.toHaveProperty("journalText");
    expect(responseSchema).not.toContain("minLength");
    expect(responseSchema).not.toContain("maxLength");
  });
});

import { GoogleGenAI } from "@google/genai";
import { DEFAULT_MODEL_ID, getSupportedGeminiModel } from "./models";
import {
  MAX_SELECTED_MEMORIES,
  parseMemorySelectionOutput,
  parseMemoryInferenceOutput,
  type MemoryCatalogItem,
  type MemoryInferenceOperation,
  type MemorySelectionOutput,
} from "./memory-types";
import type { MemorySourceBlock } from "./memory-source-blocks";

const MEMORY_SELECTOR_INSTRUCTION = `You select autobiographical memories that materially help interpret today's stream-of-consciousness writing.

Return only memory IDs from the supplied catalog. Prefer too few over loosely related context. Match indirect references, aliases, relationships, events, emotional associations, and retrospective references. Do not select generic background merely because it is recent. Evidence excerpts are intentionally unavailable. Return no IDs when nothing is strongly relevant.`;

const MEMORY_UPDATER_BLOCK_INSTRUCTION = `You maintain a compact autobiographical memory from one original journal entry.

The original entry is supplied as ordered source blocks. Consider all blocks together so you understand the entry as a whole. Create or update only context likely to materially change interpretation of future entries: recurring people and relationships, prevailing emotions, important plans, travel, holidays, major events, or other durable and significant context. Ignore minor one-off details. Consolidate with an existing record whenever possible. Do not guess how a person is related to the writer; when identity, relationship, or meaning is inferred rather than explicit, keep the wording unconfirmed, use low confidence, and allow later entries to strengthen or revise it. Preserve the writer's perspective for subjective descriptions and never turn a characterization into an objective diagnosis.

Return new memories in creates and changes to existing memories in updates. Every update must use an exact memoryId from the supplied catalog. For each operation, select the single strongest supporting source block by its exact blockId. Never reproduce or rewrite evidence text. Confidence is evidential support from 0 to 1; significance is likely future interpretive value from 0 to 1. temporalStatus is active, inactive, or uncertain. Return empty arrays when nothing deserves memory.`;

const MEMORY_UPDATER_RETRY_INSTRUCTION = `${MEMORY_UPDATER_BLOCK_INSTRUCTION}

Your previous response failed strict validation. Return a fresh response that follows every required field and length constraint. Use only block IDs and memory IDs that were supplied. Do not include memoryId in creates; include an exact catalog memoryId in every update.`;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey });
}

function parseJson(text: string): unknown {
  const normalized = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(normalized);
}

function selectorMock(journalText: string, catalog: MemoryCatalogItem[]): MemorySelectionOutput {
  const normalized = journalText.toLocaleLowerCase();
  const scored = catalog.map((memory) => {
    const terms = [memory.title, ...memory.retrievalTerms]
      .map((term) => term.toLocaleLowerCase())
      .filter((term) => term.length >= 3);
    const matches = terms.filter((term) => normalized.includes(term)).length;
    return { id: memory.id, score: matches * 10 + memory.significance + memory.confidence / 10 };
  });

  return {
    memoryIds: scored
      .filter((item) => item.score >= 10)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SELECTED_MEMORIES)
      .map((item) => item.id),
  };
}

function updateMock(sourceBlocks: MemorySourceBlock[]): MemoryInferenceOperation[] {
  const block = sourceBlocks.find((candidate) =>
    /(holiday|travel|job|school|course|birthday|wife|husband|child|colleague|anxious|nervous|sad|happy)/i.test(candidate.text)
  );
  if (!block) {
    return [];
  }

  const excerpt = block.text;
  return [{
    action: "create",
    title: `Significant context from ${block.id}`,
    summary: `The writer described a potentially significant context: ${excerpt}`.slice(0, 500),
    retrievalTerms: Array.from(new Set(
      (excerpt.match(/[A-Za-z][A-Za-z'-]{3,}/g) || []).slice(0, 8).map((term) => term.toLocaleLowerCase())
    )),
    confidence: 0.55,
    significance: 0.7,
    temporalStatus: "active",
    evidence: { blockId: block.id, effect: "supports" },
  }];
}

const inferenceFieldsSchema = {
  title: { type: "string" },
  summary: { type: "string" },
  retrievalTerms: {
    type: "array",
    items: { type: "string" },
  },
  confidence: { type: "number" },
  significance: { type: "number" },
  temporalStatus: { type: "string", enum: ["active", "inactive", "uncertain"] },
  evidence: {
    type: "object",
    properties: {
      blockId: { type: "string" },
      effect: { type: "string", enum: ["supports", "revises", "conflicts"] },
    },
    required: ["blockId", "effect"],
  },
};

const inferenceRequiredFields = [
  "title",
  "summary",
  "retrievalTerms",
  "confidence",
  "significance",
  "temporalStatus",
  "evidence",
];

export async function selectRelevantMemoryIds(
  journalText: string,
  catalog: MemoryCatalogItem[],
  modelId?: string
): Promise<string[]> {
  if (catalog.length === 0) return [];
  if (process.env.USE_AI_MOCKS === "true") {
    return selectorMock(journalText, catalog).memoryIds;
  }

  const model = getSupportedGeminiModel(modelId || process.env.GEMINI_MODEL || DEFAULT_MODEL_ID);
  const result = await getClient().models.generateContent({
    model: model.id,
    contents: JSON.stringify({ journalText, memories: catalog }),
    config: {
      systemInstruction: MEMORY_SELECTOR_INSTRUCTION,
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        properties: {
          memoryIds: { type: "array", items: { type: "string" } },
        },
        required: ["memoryIds"],
        additionalProperties: false,
      },
    },
  });

  const parsed = parseMemorySelectionOutput(parseJson(result.text || ""));
  if (!parsed) {
    throw new Error("Memory selector returned malformed output.");
  }
  return parsed.memoryIds;
}

export async function inferMemoryUpdates(
  sourceBlocks: MemorySourceBlock[],
  entryDate: string,
  catalog: MemoryCatalogItem[],
  modelId?: string
): Promise<MemoryInferenceOperation[]> {
  if (process.env.USE_AI_MOCKS === "true") {
    return updateMock(sourceBlocks);
  }

  const model = getSupportedGeminiModel(modelId || process.env.GEMINI_MODEL || DEFAULT_MODEL_ID);
  const client = getClient();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await client.models.generateContent({
      model: model.id,
      contents: JSON.stringify({
        entryDate,
        sourceBlocks: sourceBlocks.map(({ id, text }) => ({ id, text })),
        existingMemories: catalog,
      }),
      config: {
        systemInstruction: attempt === 0
          ? MEMORY_UPDATER_BLOCK_INSTRUCTION
          : MEMORY_UPDATER_RETRY_INSTRUCTION,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            creates: {
              type: "array",
              items: {
                type: "object",
                properties: inferenceFieldsSchema,
                required: inferenceRequiredFields,
              },
            },
            updates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  memoryId: { type: "string" },
                  ...inferenceFieldsSchema,
                },
                required: ["memoryId", ...inferenceRequiredFields],
              },
            },
          },
          required: ["creates", "updates"],
        },
      },
    });

    try {
      const parsed = parseMemoryInferenceOutput(parseJson(result.text || ""));
      if (parsed) return parsed;
    } catch {
      // Retry below with a clean request and a stricter reminder.
    }
    if (attempt === 0) {
      console.warn("Memory updater returned invalid structured output; retrying once.");
    }
  }

  throw new Error("Memory updater returned malformed output after one retry.");
}

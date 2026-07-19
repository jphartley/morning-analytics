import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerSupabase: vi.fn(),
}));

vi.mock("./supabase", () => ({
  getServerSupabase: mocks.getServerSupabase,
}));

import {
  applyMemoryOperations,
  isExactEvidenceBlock,
  listMemoriesWithEvidence,
  resetMemoryStore,
  selectNewestEntriesForReplay,
  type JournalEntryForMemory,
} from "./memory-storage";

function entry(id: string, createdAt: string): JournalEntryForMemory {
  return { id, inputText: `Entry ${id}`, createdAt };
}

describe("memory evidence blocks", () => {
  it("accepts only exact source substrings", () => {
    expect(isExactEvidenceBlock(
      "Tarek and I argued\nagain about the project.",
      "Tarek and I argued\nagain"
    )).toBe(true);
  });

  it("rejects rewritten or invented evidence", () => {
    expect(isExactEvidenceBlock("I can’t wait — we leave tomorrow!", "I can't wait - we leave tomorrow"))
      .toBe(false);
    expect(isExactEvidenceBlock("We discussed the project.", "Tarek is a narcissist."))
      .toBe(false);
  });
});

describe("memory storage ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects a source analysis owned by another user before writing memory", async () => {
    const single = vi.fn(async () => ({
      data: { id: "analysis-1", user_id: "owner-1" },
      error: null,
    }));
    const from = vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single })) })),
    }));
    mocks.getServerSupabase.mockReturnValue({ from });

    await expect(applyMemoryOperations(
      "other-user",
      "analysis-1",
      "2026-07-19T08:00:00.000Z",
      "We leave for India soon.",
      []
    )).rejects.toThrow("not owned");
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("validates every evidence excerpt before making the first memory write", async () => {
    const single = vi.fn(async () => ({
      data: { id: "analysis-1", user_id: "owner-1" },
      error: null,
    }));
    const from = vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single })) })),
    }));
    mocks.getServerSupabase.mockReturnValue({ from });

    const operation = {
      action: "create" as const,
      title: "India holiday",
      summary: "The writer is preparing for a holiday in India.",
      retrievalTerms: ["India", "holiday"],
      confidence: 0.7,
      significance: 0.8,
      temporalStatus: "active" as const,
      evidence: { excerpt: "We are going to India", effect: "supports" as const },
    };

    await expect(applyMemoryOperations(
      "owner-1",
      "analysis-1",
      "2026-07-19T08:00:00.000Z",
      "We are going to India next month.",
      [operation, {
        ...operation,
        title: "Invented relationship",
        evidence: { excerpt: "Tarek is my colleague", effect: "supports" },
      }]
    )).rejects.toThrow("not an exact source block");
    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("analyses");
  });

  it("resets only the requesting user's memory table and never analyses", async () => {
    const eq = vi.fn(async () => ({ error: null }));
    const from = vi.fn((table: string) => {
      expect(table).toBe("memories");
      return { delete: vi.fn(() => ({ eq })) };
    });
    mocks.getServerSupabase.mockReturnValue({ from });

    await resetMemoryStore("owner-1");

    expect(eq).toHaveBeenCalledWith("user_id", "owner-1");
    expect(from).not.toHaveBeenCalledWith("analyses");
  });

  it("returns an empty complete store and preserves evidence order from storage", async () => {
    const makeQuery = (data: unknown[]) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(async () => ({ data, error: null })),
        })),
      })),
    });
    const from = vi.fn((table: string) => makeQuery(table === "memories" ? [] : []));
    mocks.getServerSupabase.mockReturnValue({ from });

    await expect(listMemoriesWithEvidence("owner-1")).resolves.toEqual([]);
    expect(from).toHaveBeenCalledWith("memories");
    expect(from).toHaveBeenCalledWith("memory_evidence");
  });
});

describe("selectNewestEntriesForReplay", () => {
  it("takes the newest N from descending results and replays them oldest-to-newest", () => {
    const descending = [
      entry("5", "2026-07-05T08:00:00.000Z"),
      entry("4", "2026-07-04T08:00:00.000Z"),
      entry("3", "2026-07-03T08:00:00.000Z"),
      entry("2", "2026-07-02T08:00:00.000Z"),
      entry("1", "2026-07-01T08:00:00.000Z"),
    ];

    expect(selectNewestEntriesForReplay(descending, 3).map((value) => value.id))
      .toEqual(["3", "4", "5"]);
  });

  it("supports an empty store", () => {
    expect(selectNewestEntriesForReplay([], 7)).toEqual([]);
  });
});

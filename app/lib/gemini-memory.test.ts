import { describe, expect, it } from "vitest";
import { buildAnalysisSystemInstruction } from "./gemini";

describe("contextual memory prompt", () => {
  it("keeps an empty prompt unchanged", () => {
    expect(buildAnalysisSystemInstruction("Persona prompt", [])).toBe("Persona prompt");
  });

  it("adds only compact summaries and uncertainty guidance", () => {
    const instruction = buildAnalysisSystemInstruction("Persona prompt", [{
      id: "00000000-0000-4000-8000-000000000001",
      version: 2,
      title: "India holiday",
      summary: "The writer is preparing for a holiday in India.",
    }]);

    expect(instruction).toContain("Today's writing is primary");
    expect(instruction).toContain("India holiday: The writer is preparing");
    expect(instruction).not.toContain("source_entry_at");
    expect(instruction).not.toContain("evidence");
  });
});

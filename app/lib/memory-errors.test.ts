import { describe, expect, it } from "vitest";
import {
  getMemoryActionErrorMessage,
  getMemoryRebuildFailure,
  getMemoryRebuildEntryErrorMessage,
} from "./memory-errors";

describe("contextual memory diagnostics", () => {
  it("turns a missing schema into an actionable diagnostic", () => {
    expect(getMemoryActionErrorMessage(
      new Error("Could not find the table 'public.memories' in the schema cache"),
      "Fallback"
    )).toContain("20260719090000_add_contextual_memory.sql");
  });

  it("keeps the supplied safe fallback for unrelated errors", () => {
    expect(getMemoryActionErrorMessage(new Error("Provider unavailable"), "Safe fallback"))
      .toBe("Safe fallback");
  });

  it("classifies invalid block references without exposing journal text", () => {
    expect(getMemoryRebuildEntryErrorMessage(
      new Error("Memory inference referenced unknown source block b99.")
    )).toContain("source block");
    expect(getMemoryRebuildFailure(
      new Error("Memory inference referenced unknown source block b99.")
    )).toMatchObject({ code: "invalid_block_reference" });
  });

  it("classifies a Gemini HTTP 400 as a request configuration error", () => {
    const error = Object.assign(
      new Error('{"error":{"code":400,"status":"INVALID_ARGUMENT"}}'),
      { status: 400 }
    );

    expect(getMemoryRebuildFailure(error)).toEqual({
      code: "request_configuration_error",
      message: "Gemini rejected the memory inference request as invalid (HTTP 400).",
    });
  });
});

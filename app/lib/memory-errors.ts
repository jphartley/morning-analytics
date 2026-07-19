export function getMemoryActionErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : String(error || "");
  const missingContextualMemorySchema = message.includes("schema cache") && (
    message.includes("public.memories")
    || message.includes("public.memory_evidence")
    || message.includes("memory_context")
  );

  return missingContextualMemorySchema
    ? "Contextual memory is not set up in Supabase. Apply migration 20260719090000_add_contextual_memory.sql, then reopen this drawer."
    : fallback;
}

export function getMemoryRebuildEntryErrorMessage(error: unknown): string {
  return getMemoryRebuildFailure(error).message;
}

export type MemoryRebuildFailureCode =
  | "request_configuration_error"
  | "invalid_ai_output"
  | "invalid_block_reference"
  | "invalid_memory_reference"
  | "source_entry_unavailable"
  | "persistence_error"
  | "provider_error"
  | "unknown_error";

export interface MemoryRebuildFailureDetail {
  code: MemoryRebuildFailureCode;
  message: string;
}

export function getMemoryRebuildFailure(error: unknown): MemoryRebuildFailureDetail {
  const message = error instanceof Error ? error.message : String(error || "");
  const normalized = message.toLocaleLowerCase();
  const status = typeof error === "object" && error !== null && "status" in error
    ? Number(error.status)
    : null;

  if (status === 400 || normalized.includes("invalid_argument")) {
    return {
      code: "request_configuration_error",
      message: "Gemini rejected the memory inference request as invalid (HTTP 400).",
    };
  }

  if (normalized.includes("malformed output")) {
    return {
      code: "invalid_ai_output",
      message: "Gemini returned memory data in an invalid format after one automatic retry.",
    };
  }
  if (normalized.includes("unknown source block") || normalized.includes("exact source block")) {
    return {
      code: "invalid_block_reference",
      message: "Gemini selected a source block that was not available for this journal entry.",
    };
  }
  if (normalized.includes("differently owned record") || normalized.includes("memory update referenced")) {
    return {
      code: "invalid_memory_reference",
      message: "Gemini selected an existing memory that was not available in the current catalog.",
    };
  }
  if (normalized.includes("analysis is unavailable") || normalized.includes("not owned")) {
    return {
      code: "source_entry_unavailable",
      message: "The saved journal entry was unavailable or did not belong to the current user.",
    };
  }
  if (
    normalized.includes("failed to create memory")
    || normalized.includes("failed to update memory")
    || normalized.includes("failed to store memory evidence")
    || normalized.includes("failed to validate memory ownership")
  ) {
    return {
      code: "persistence_error",
      message: "The inferred memory could not be saved to the contextual memory store.",
    };
  }
  if (
    normalized.includes("gemini")
    || normalized.includes("api")
    || normalized.includes("fetch")
    || normalized.includes("network")
    || normalized.includes("timeout")
  ) {
    return {
      code: "provider_error",
      message: "Gemini could not complete memory inference for this journal entry.",
    };
  }

  return {
    code: "unknown_error",
    message: getMemoryActionErrorMessage(error, "This journal entry could not be processed."),
  };
}

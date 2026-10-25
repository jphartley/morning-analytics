export type ActionErrorCode = "unauthenticated" | "forbidden" | "account-settings-unavailable" | "resource-unavailable" | "invalid-input" | "operation-failed";

export class ActionError extends Error {
  constructor(public readonly code: ActionErrorCode, message: string) {
    super(message);
    this.name = "ActionError";
  }
}

export function actionFailure(error: unknown, fallback: string) {
  return {
    success: false as const,
    errorCode: error instanceof ActionError ? error.code : "operation-failed" as const,
    error: error instanceof ActionError ? error.message : fallback,
  };
}

export function unavailable(): never {
  throw new ActionError("resource-unavailable", "Analysis is unavailable.");
}

export function validateActionInput(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || "userId" in value || "user_id" in value || "role" in value) {
    throw new ActionError("invalid-input", "Please refresh the page and try again.");
  }
}

export function requireText(value: unknown, message: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) throw new ActionError("invalid-input", message);
}

export function requireResourceId(value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) unavailable();
}

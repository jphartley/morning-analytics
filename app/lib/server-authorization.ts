import "server-only";
import { createRequestSupabase } from "./supabase-server";
import type { AuthorizedActor } from "./authorization-types";
import { ActionError } from "./action-errors";
import { DEFAULT_MODEL_ID, getGeminiModelById } from "./models";
import type { SingleAnalysisMemoryMode } from "./analysis-memory-mode";

export async function requireActor(): Promise<AuthorizedActor> {
  const supabase = await createRequestSupabase();
  let user;
  try {
    const result = await supabase.auth.getUser();
    if (result.error || !result.data.user) throw new Error("No verified session");
    user = result.data.user;
  } catch {
    throw new ActionError("unauthenticated", "Please sign in again, then retry this operation.");
  }
  try {
    const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (error || !profile || (profile.role !== "admin" && profile.role !== "user")) throw new Error("No valid profile");
    return { userId: user.id, role: profile.role, supabase };
  } catch {
    throw new ActionError("account-settings-unavailable", "Your account settings could not be loaded. Please refresh and try again.");
  }
}

export function requireAdministrator(actor: AuthorizedActor, testOnly = false) {
  if (actor.role !== "admin" || (testOnly && process.env.NEXT_PUBLIC_TEST_VIEW_ENABLED === "false")) {
    throw new ActionError("forbidden", "This operation is unavailable for your account.");
  }
}

export function authorizedModel(actor: AuthorizedActor, value?: string) {
  const model = value ?? DEFAULT_MODEL_ID;
  if (!getGeminiModelById(model)) throw new ActionError("invalid-input", "Choose an available model.");
  if (actor.role !== "admin" && model !== DEFAULT_MODEL_ID) requireAdministrator(actor);
  return model;
}

export function authorizedMemoryMode(actor: AuthorizedActor, value?: SingleAnalysisMemoryMode): SingleAnalysisMemoryMode {
  const mode = value ?? (actor.role === "admin" ? "with-memory" : "without-memory");
  if (mode !== "with-memory" && mode !== "without-memory") throw new ActionError("invalid-input", "Choose an available memory option.");
  if (mode === "with-memory") requireAdministrator(actor);
  return mode;
}

export function authorizedProviderOverride(actor: AuthorizedActor, value?: string | null) {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value !== "string") throw new ActionError("invalid-input", "Choose an available image provider.");
  if (!value.trim()) return undefined;
  requireAdministrator(actor);
  return value;
}

export function authorizedPersona(value: unknown = "jungian"): string {
  if (typeof value !== "string" || !["jungian", "mel-robbins", "loving-parent"].includes(value)) {
    throw new ActionError("invalid-input", "Choose an available analyst.");
  }
  return value;
}

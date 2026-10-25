import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv, sessionCookieOptions } from "./supabase-config";
import type { ImageGenerationBatch } from "./image-generation-types";
import type { MemoryContextItem } from "./memory-types";

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}

// Database types
export interface AnalysisRecord {
  id: string;
  created_at: string;
  user_id: string;
  input_text: string;
  analysis_text: string;
  image_prompt: string | null;
  model_id: string;
  image_paths: string[] | null;
  image_generation_batches?: ImageGenerationBatch[] | null;
  analyst_persona?: string | null;
  memory_context?: MemoryContextItem[] | null;
}

export interface AnalysisInsert {
  id?: string;
  user_id: string;
  input_text: string;
  analysis_text: string;
  image_prompt?: string | null;
  model_id: string;
  image_paths?: string[] | null;
  image_generation_batches?: ImageGenerationBatch[];
  analyst_persona?: string;
  memory_context?: MemoryContextItem[] | null;
}

export interface AnalysisListItem {
  id: string;
  created_at: string;
  input_preview: string;
}

let browserClient: SupabaseClient | null = null;

export function clearObsoleteAuthStorage(): void {
  if (typeof window === "undefined") return;
  const { url } = getSupabasePublicEnv();
  const key = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  try {
    [key, `${key}-code-verifier`, `${key}-user`].forEach((name) => window.localStorage.removeItem(name));
  } catch {
    // Cookie authentication still works when local storage is unavailable.
  }
}

export function assertClientSupabaseEnv(): void {
  getSupabasePublicEnv();
}

export function getBrowserSupabase(): SupabaseClient {
  if (!browserClient) {
    const { url, anonKey } = getSupabasePublicEnv();
    clearObsoleteAuthStorage();
    browserClient = createBrowserClient(url, anonKey, { cookieOptions: sessionCookieOptions() });
  }
  return browserClient;
}

export async function getClientAuth() {
  const { data: { session } } = await getBrowserSupabase().auth.getSession();
  return session?.user;
}

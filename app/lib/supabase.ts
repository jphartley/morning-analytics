import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Database types
export interface AnalysisRecord {
  id: string;
  created_at: string;
  input_text: string;
  analysis_text: string;
  image_prompt: string | null;
  model_id: string;
  image_paths: string[] | null;
}

export interface AnalysisInsert {
  id?: string;
  input_text: string;
  analysis_text: string;
  image_prompt?: string | null;
  model_id: string;
  image_paths?: string[] | null;
}

export interface AnalysisListItem {
  id: string;
  created_at: string;
  input_preview: string;
}

const SERVER_ENV_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

// Environment validation
function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || "";
}

function validateEnvVars(names: string[]): void {
  names.forEach((name) => {
    getEnvVar(name);
  });
}

function getClientEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { url, anonKey };
}

export function assertServerSupabaseEnv(): void {
  validateEnvVars(SERVER_ENV_VARS);
}

export function assertClientSupabaseEnv(): void {
  getClientEnv();
}

// Lazy initialization to avoid errors during build
let serverClient: SupabaseClient | null = null;
let browserClient: SupabaseClient | null = null;

/**
 * Get Supabase client for server-side operations (Server Actions)
 * Uses service role key to bypass RLS
 */
export function getServerSupabase(): SupabaseClient {
  if (!serverClient) {
    assertServerSupabaseEnv();
    const url = getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");
    serverClient = createClient(url, serviceKey);
  }
  return serverClient;
}

/**
 * Get Supabase client for client-side operations
 * Uses anon key with RLS policies
 */
export function getBrowserSupabase(): SupabaseClient {
  if (!browserClient) {
    assertClientSupabaseEnv();
    const { url, anonKey } = getClientEnv();
    browserClient = createClient(url, anonKey);
  }
  return browserClient;
}

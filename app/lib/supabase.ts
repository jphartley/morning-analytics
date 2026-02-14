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

// Environment validation
function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || "";
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
    const url = getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
    const anonKey = getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    browserClient = createClient(url, anonKey);
  }
  return browserClient;
}

/**
 * Check if Supabase is configured
 * Returns false if env vars are missing (allows app to run without Supabase)
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

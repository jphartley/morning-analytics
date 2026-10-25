import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthorizedActor } from "@/lib/authorization-types";

export function testActor(supabase: unknown = {}, userId = "test-owner", role: AuthorizedActor["role"] = "admin"): AuthorizedActor {
  return { userId, role, supabase: supabase as SupabaseClient };
}

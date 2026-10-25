import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicationRole } from "./role-capabilities";

export interface AuthorizedActor {
  readonly userId: string;
  readonly role: ApplicationRole;
  readonly supabase: SupabaseClient;
}

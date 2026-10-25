export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase public configuration is missing.");
  return { url, anonKey };
}

export function sessionCookieOptions() {
  return { path: "/", sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
}

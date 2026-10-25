import { redirect } from "next/navigation";
import JournalApp from "@/components/JournalApp";
import { createRequestSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createRequestSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/signin");
  return <JournalApp />;
}

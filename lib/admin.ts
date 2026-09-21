import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase-server";

/**
 * Server-side admin gate.
 *
 * Call at the top of every /admin page and every privileged server action.
 * Admin status is always verified server-side (session + profiles.is_admin);
 * client-side checks in the UI are convenience only and never the real gate.
 */
export async function requireAdmin() {
  const supabase = createServerSupabase();
  if (!supabase) redirect("/setup");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin?next=/admin");

  const { data } = await supabase
    .from("profiles")
    .select("id, username, is_admin")
    .eq("id", user.id)
    .single();
  const profile = data as { id: string; username: string; is_admin: boolean } | null;
  if (!profile?.is_admin) redirect("/");

  return { supabase, user, profile };
}

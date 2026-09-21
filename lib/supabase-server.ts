import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./supabase";

/**
 * Server-side Supabase client (server components / route handlers).
 * Returns null when env keys are missing so pages can fall back to demo data.
 */
export function createServerSupabase() {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // no-op: server components cannot set cookies
        },
        remove() {
          // no-op: server components cannot set cookies
        },
      },
    }
  );
}

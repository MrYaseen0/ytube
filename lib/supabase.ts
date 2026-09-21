import { createBrowserClient } from "@supabase/ssr";

/** True when both public Supabase env vars are present and look real. */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url && key && url.startsWith("http") && !key.includes("your-anon")
  );
}

export function supabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function supabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

/** Browser-side Supabase client (call only from client components). */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}

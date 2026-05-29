import { createBrowserClient } from "@supabase/ssr";

// Browser Supabase client (anon key only). Used for client-side auth actions
// like initiating OAuth. No secrets here.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

import type { UsersProfileRow } from "@/lib/supabase/database.types";

// True when Supabase env is present. When absent, the app runs in a no-backend
// "demo mode" so the frontend can be previewed (e.g. on Vercel or locally)
// without standing up Supabase. Demo mode acts as a fixed signed-in user and
// serves live mock award data.
export function isSupabaseConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// The pretend signed-in user used in demo mode. Includes Bilt so transfer paths
// resolve for programs like Alaska, and a couple of home airports.
export const DEMO_USER_ID = "demo-user";

export const DEMO_PROFILE: UsersProfileRow = {
  id: DEMO_USER_ID,
  home_airports: ["JFK", "SFO"],
  points_programs: ["CHASE_UR", "AMEX_MR", "BILT"],
  cabin_pref: "economy",
  subscription_tier: "free",
  stripe_customer_id: null,
  onboarded: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

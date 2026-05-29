import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UsersProfileRow } from "@/lib/supabase/database.types";
import { isSupabaseConfigured, DEMO_PROFILE, DEMO_USER_ID } from "@/lib/demo";

// Auth + profile access for Server Components and Server Actions. All reads go
// through the request-bound server client, so RLS applies. When Supabase is not
// configured, the app runs in demo mode as a fixed signed-in user.

export async function getUser() {
  if (!isSupabaseConfigured()) return { id: DEMO_USER_ID } as { id: string };
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<UsersProfileRow | null> {
  if (!isSupabaseConfigured()) return DEMO_PROFILE;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users_profile")
    .select("*")
    .eq("id", user.id)
    .single();

  return (data as UsersProfileRow) ?? null;
}

// Use in private pages. Redirects to /login if signed out, and to /onboarding
// if the profile has not completed onboarding yet.
export async function requireProfile(options?: { skipOnboardingCheck?: boolean }) {
  if (!isSupabaseConfigured()) return DEMO_PROFILE;
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!options?.skipOnboardingCheck && !profile.onboarded) redirect("/onboarding");
  return profile;
}

export function isPremium(profile: Pick<UsersProfileRow, "subscription_tier">): boolean {
  return profile.subscription_tier === "premium";
}

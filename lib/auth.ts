import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UsersProfileRow } from "@/lib/supabase/database.types";

// Auth + profile access for Server Components and Server Actions. All reads go
// through the request-bound server client, so RLS applies.

export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(): Promise<UsersProfileRow | null> {
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
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!options?.skipOnboardingCheck && !profile.onboarded) redirect("/onboarding");
  return profile;
}

export function isPremium(profile: Pick<UsersProfileRow, "subscription_tier">): boolean {
  return profile.subscription_tier === "premium";
}

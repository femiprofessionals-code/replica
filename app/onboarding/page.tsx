import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Set up your profile · ClearPoints" };

export default async function OnboardingPage() {
  // Allow access before onboarding is complete, but bounce finished users.
  const profile = await requireProfile({ skipOnboardingCheck: true });
  if (profile.onboarded) redirect("/search");

  return (
    <main className="aurora min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
          Welcome to ClearPoints
        </p>
        <h1 className="mt-2 text-3xl font-bold text-primary">Let us personalize your points</h1>
        <p className="mt-2 text-muted">
          Two quick questions. This is what lets us show which of your points can actually book
          each flight, and what they are worth.
        </p>

        <div className="mt-10 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <OnboardingForm
            defaults={{
              home_airports: profile.home_airports ?? [],
              points_programs: profile.points_programs ?? [],
              cabin_pref: profile.cabin_pref ?? "economy",
            }}
          />
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import { Crown } from "lucide-react";
import { requireProfile, isPremium } from "@/lib/auth";
import { Card, Badge } from "@/components/ui";
import { AccountForm } from "./account-form";

export const metadata = { title: "Account · ClearPoints" };

export default async function AccountPage() {
  const profile = await requireProfile();
  const premium = isPremium(profile);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold text-primary">Account</h1>
        <p className="text-muted">Manage the details that personalize your deals.</p>
      </header>

      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-primary text-white">
            <Crown className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm text-muted">Current plan</p>
            <p className="flex items-center gap-2 font-semibold text-primary">
              {premium ? "Premium" : "Free"}
              <Badge tone={premium ? "gold" : "neutral"}>{premium ? "All cabins, 365 days" : "Economy, 90 days"}</Badge>
            </p>
          </div>
        </div>
        {!premium ? (
          <Link href="/points-101" className="text-sm font-semibold text-secondary hover:underline">
            What Premium unlocks
          </Link>
        ) : null}
      </Card>

      <Card>
        <AccountForm
          defaults={{
            home_airports: profile.home_airports ?? [],
            points_programs: profile.points_programs ?? [],
            cabin_pref: profile.cabin_pref ?? "economy",
          }}
        />
      </Card>
    </div>
  );
}

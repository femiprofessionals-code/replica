import Link from "next/link";
import { ArrowRight, Building2, Repeat, ShieldCheck, Plane } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { Card } from "@/components/ui";
import { AIRLINE_PROGRAMS, POINTS_PROGRAMS } from "@/lib/reference-data";
import { ValueComparison } from "./value-comparison";

export const metadata = {
  title: "Points 101 · ClearPoints",
  description:
    "Understand the value gap between cash back, card portals, and transferring points to airlines.",
};

// Static explainer, regenerated daily.
export const revalidate = 86_400;

export default function Points101Page() {
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="aurora">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <header className="mb-10 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
              Points 101
            </p>
            <h1 className="mt-2 text-4xl font-bold text-primary">
              Your points are worth more than one cent
            </h1>
            <p className="mt-3 text-lg text-muted">
              Most people cash points out at the floor. The same points, transferred to the right
              airline program, can be worth three to five times as much. Here is why, and how to
              capture it.
            </p>
          </header>

          <ValueComparison />

          <section className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Step
              icon={Building2}
              n={1}
              title="You earn bank points"
              body={`Cards earn flexible currencies like ${POINTS_PROGRAMS[0].displayName.split(" ").slice(-2).join(" ")} or Chase Ultimate Rewards. We track ${POINTS_PROGRAMS.length} of them.`}
            />
            <Step
              icon={Repeat}
              n={2}
              title="You transfer to an airline"
              body={`Bank points move to airline programs, often one to one and instantly. We map paths to ${AIRLINE_PROGRAMS.length} airline programs.`}
            />
            <Step
              icon={Plane}
              n={3}
              title="You book an award seat"
              body="Airline award seats are priced in miles, not cash. A business class seat that costs thousands in cash can be a fraction in points."
            />
          </section>

          <section className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <h3 className="text-lg font-semibold text-primary">Why the portal is a trap</h3>
              <p className="mt-2 text-muted">
                Card travel portals feel convenient, but they lock your points to a fixed rate of
                around 1.25 to 1.5 cents. You are still buying a revenue ticket. Transferring to an
                airline lets you book award space, where the value lives.
              </p>
            </Card>
            <Card>
              <h3 className="text-lg font-semibold text-primary">When cash back still wins</h3>
              <p className="mt-2 text-muted">
                If you only fly domestic economy on cheap fares, transferring may not beat cash. We
                always show the cash reference next to the points price so you can see the honest
                comparison and choose for yourself.
              </p>
            </Card>
          </section>

          <section className="mt-12 rounded-2xl border border-border bg-primary p-8 text-white">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-md">
                <h3 className="text-2xl font-bold">See it with your own points</h3>
                <p className="mt-2 text-white/80">
                  Tell us your home airports and the programs you collect. We will show real award
                  space, what it is worth, and exactly how to book it.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-cta px-6 py-3 font-semibold text-white transition hover:brightness-95"
              >
                Get started
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </section>

          <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-muted">
            <ShieldCheck className="size-4 text-positive" aria-hidden />
            Every points and cash figure in the app comes from data, never a guess.
          </p>
        </div>
      </main>
    </div>
  );
}

function Step({
  icon: Icon,
  n,
  title,
  body,
}: {
  icon: React.ElementType;
  n: number;
  title: string;
  body: string;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-lg bg-secondary/10 text-secondary">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="tnum text-3xl font-bold text-border">{n}</span>
      </div>
      <h3 className="font-semibold text-primary">{title}</h3>
      <p className="text-sm text-muted">{body}</p>
    </Card>
  );
}

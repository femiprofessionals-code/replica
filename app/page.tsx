import Link from "next/link";
import { ArrowRight, Check, Eye, Route, Sparkles } from "lucide-react";
import { AppNav } from "@/components/app-nav";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <AppNav />

      {/* Hero */}
      <section className="aurora">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-secondary">
            <Sparkles className="size-4" aria-hidden />
            Stop leaving points on the table
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight text-primary sm:text-6xl">
            See what your points are really worth
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            ClearPoints turns the credit card points you already have into real flights. Compare
            cash, portal, and transfer value side by side, then book with step-by-step
            instructions for your exact programs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-cta px-6 py-3 font-semibold text-white transition hover:brightness-95"
            >
              Start free
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/points-101"
              className="inline-flex items-center gap-2 rounded-lg border border-primary px-6 py-3 font-semibold text-primary transition hover:bg-background"
            >
              See the value gap
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted">Free to start. No card required.</p>
        </div>
      </section>

      {/* Problem */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-primary">
            Points are confusing on purpose
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted">
            Banks make it easy to cash out at one cent and hard to do anything better. Award charts
            are buried, transfer partners are a maze, and seat availability changes by the hour. So
            most people give up and lose hundreds of dollars in value every year.
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold text-primary">How ClearPoints helps</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Feature
            icon={Eye}
            title="Honest value, every time"
            body="We put the cash reference next to the points price and compute cents per point, so you always know if a redemption is actually good."
          />
          <Feature
            icon={Route}
            title="Tied to your wallet"
            body="Tell us which points you collect once. Every result shows whether your programs can reach that airline, and the transfer ratio to use."
          />
          <Feature
            icon={Check}
            title="Book with confidence"
            body="Each deal comes with clear, step-by-step booking instructions for the airline program, so you are never guessing at checkout."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-16 text-center text-white">
          <h2 className="text-3xl font-bold">Ready to fly further on the same points?</h2>
          <p className="max-w-xl text-white/80">
            Set up your profile in two minutes and run your first search on live award data.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-cta px-6 py-3 font-semibold text-white transition hover:brightness-95"
          >
            Create your free account
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted sm:flex-row">
          <span>ClearPoints. See what your points are really worth.</span>
          <Link href="/points-101" className="hover:text-primary">
            Points 101
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <span className="grid size-10 place-items-center rounded-lg bg-secondary/10 text-secondary">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-primary">{title}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </div>
  );
}

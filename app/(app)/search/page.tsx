import { PlaneTakeoff } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { getProvider } from "@/lib/award-data";
import type { Cabin, RouteQuery } from "@/lib/types";
import { CABINS } from "@/lib/types";
import { DealCard } from "@/components/deal-card";
import { SearchForm } from "./search-form";

export const metadata = { title: "Flight Search · ClearPoints" };

type Params = {
  origin?: string;
  destination?: string;
  cabin?: string;
  date?: string;
  rangeStart?: string;
  rangeEnd?: string;
  pax?: string;
};

function asCabin(value: string | undefined, fallback: Cabin): Cabin {
  return CABINS.includes(value as Cabin) ? (value as Cabin) : fallback;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;

  const defaults: Params = {
    origin: params.origin ?? profile.home_airports[0],
    destination: params.destination,
    cabin: params.cabin ?? profile.cabin_pref,
    date: params.date,
    rangeStart: params.rangeStart,
    rangeEnd: params.rangeEnd,
    pax: params.pax ?? "1",
  };

  const hasQuery = !!params.origin && !!params.destination;
  let results = [] as Awaited<ReturnType<ReturnType<typeof getProvider>["searchRoute"]>>;

  if (hasQuery) {
    const query: RouteQuery = {
      origin: params.origin!,
      destination: params.destination!,
      cabin: asCabin(params.cabin, profile.cabin_pref),
      pax: Math.max(1, Number(params.pax ?? "1") || 1),
      ...(params.rangeStart && params.rangeEnd
        ? { range: { start: params.rangeStart, end: params.rangeEnd } }
        : params.date
          ? { date: params.date }
          : {}),
    };
    results = await getProvider().searchRoute(query);
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold text-primary">Flight search</h1>
        <p className="text-muted">
          Find award space on a route, see what it is worth, and learn exactly how to book it
          with the points you already have.
        </p>
      </header>

      <SearchForm defaults={defaults} />

      {!hasQuery ? (
        <EmptyState />
      ) : results.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          No award space found for that search. Try a date range or a different cabin.
        </p>
      ) : (
        <section className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {results.length} options found, ranked by value. Numbers come from live award data.
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {results.map((r) => (
              <DealCard key={r.id} result={r} userPrograms={profile.points_programs} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface p-12 text-center">
      <PlaneTakeoff className="size-8 text-secondary" aria-hidden />
      <p className="font-semibold text-primary">Pick a route to begin</p>
      <p className="max-w-md text-sm text-muted">
        We prefilled your home airport. Choose a destination and search to see award pricing,
        value, and a transfer path tied to your programs.
      </p>
    </div>
  );
}

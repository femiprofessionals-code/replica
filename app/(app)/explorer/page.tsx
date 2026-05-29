import { requireProfile, isPremium } from "@/lib/auth";
import { getProvider } from "@/lib/award-data";
import type { Cabin } from "@/lib/types";
import { CABINS } from "@/lib/types";
import { applyExplorerGate, FREE_WINDOW_DAYS } from "@/lib/gating";
import { today, addDays, isoDate } from "@/lib/award-data/dates";
import { DealCard } from "@/components/deal-card";
import { GateBanner } from "@/components/gate-banner";
import { ExplorerForm } from "./explorer-form";

export const metadata = { title: "Top Deals Explorer · ClearPoints" };

// searchParams values are string | string[] | undefined. Normalize to arrays.
function toArray(value: string | string[] | undefined): string[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function ExplorerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireProfile();
  const premium = isPremium(profile);
  const params = await searchParams;

  const requestedOrigins = toArray(params.origins);
  const requestedDestinations = toArray(params.destinations);
  const requestedCabins = toArray(params.cabins).filter((c) =>
    CABINS.includes(c as Cabin),
  ) as Cabin[];

  const origins = (requestedOrigins.length ? requestedOrigins : profile.home_airports).slice(0, 6);
  const destinations = requestedDestinations.slice(0, 6);

  const windowStartParam = typeof params.windowStart === "string" ? params.windowStart : undefined;
  const windowEndParam = typeof params.windowEnd === "string" ? params.windowEnd : undefined;

  // Enforce the tier gate on cabins and window before touching the provider.
  const gate = applyExplorerGate(profile.subscription_tier, {
    cabins: requestedCabins.length ? requestedCabins : (["economy"] as Cabin[]),
    window:
      windowStartParam && windowEndParam
        ? { start: windowStartParam, end: windowEndParam }
        : undefined,
  });

  const hasQuery = origins.length > 0 && destinations.length > 0;
  let results = [] as Awaited<ReturnType<ReturnType<typeof getProvider>["searchBulk"]>>;

  if (hasQuery) {
    results = await getProvider().searchBulk({
      origins,
      destinations,
      cabins: gate.cabins,
      window: gate.window,
      pax: 1,
      maxPerPair: 2,
    });
  }

  const defaultWindow = {
    start: isoDate(today()),
    end: isoDate(addDays(today(), premium ? 365 : FREE_WINDOW_DAYS)),
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-bold text-primary">Top deals explorer</h1>
        <p className="text-muted">
          Scan up to six origins by six destinations and surface the best value award space,
          ranked across your window.
        </p>
      </header>

      <ExplorerForm
        premium={premium}
        defaults={{
          origins,
          destinations,
          cabins: requestedCabins.length ? requestedCabins : ["economy"],
          windowStart: windowStartParam ?? defaultWindow.start,
          windowEnd: windowEndParam ?? defaultWindow.end,
        }}
      />

      {!premium && (gate.cabinsClamped || gate.windowClamped) ? (
        <GateBanner
          title="You are on the free plan"
          detail={`Showing economy across the next ${FREE_WINDOW_DAYS} days. Your request for premium cabins or a longer window was limited.`}
        />
      ) : null}

      {!hasQuery ? (
        <p className="rounded-xl border border-dashed border-border bg-surface p-12 text-center text-muted">
          Choose at least one destination to explore deals from your home airports.
        </p>
      ) : results.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          No deals matched. Widen your origins, destinations, or dates.
        </p>
      ) : (
        <section className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            {results.length} deals across {origins.length} origins and {destinations.length}{" "}
            destinations, ranked by value over {gate.windowDays} days.
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

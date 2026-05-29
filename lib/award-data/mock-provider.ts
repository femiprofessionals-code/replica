import type { AwardDataProvider } from "./provider";
import type {
  AwardResult,
  BulkQuery,
  Cabin,
  RouteQuery,
  AlertFilter,
  DateRange,
} from "@/lib/types";
import { computeValue } from "@/lib/money";
import { AIRLINE_PROGRAMS, AIRLINE_PROGRAM_NAME } from "@/lib/reference-data";
import {
  baseCashUsd,
  baseMiles,
  haulBand,
  HIGH_SURCHARGE_PROGRAMS,
  LOW_SURCHARGE_PROGRAMS,
  AIRPORTS,
} from "./catalog";
import { Rng } from "./rng";
import { addDays, isoDate, today, daysBetween } from "./dates";

const SEED = process.env.MOCK_SEED ?? "clearpoints-phase1";
const ALL_PROGRAM_CODES = AIRLINE_PROGRAMS.map((p) => p.code);

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

// Generate one realistic award for a route/cabin/program departing within the
// given window. Deterministic given the seed key.
function makeAward(
  origin: string,
  destination: string,
  cabin: Cabin,
  program: string,
  window: DateRange,
  seedKey: string,
): AwardResult {
  const rng = new Rng(`${SEED}:${seedKey}:${origin}:${destination}:${cabin}:${program}`);
  const band = haulBand(origin, destination);

  const pointsCost = roundTo(baseMiles(band, cabin) * rng.range(0.8, 1.3), 500);
  // Round cash to cents first so the stored value and the derived cpp/discount
  // are computed from exactly the same number (keeps numbers internally exact).
  const cashReferenceUsd = Math.round(baseCashUsd(band, cabin) * rng.range(0.85, 1.3) * 100) / 100;

  // Taxes depend on the program's typical fuel-surcharge behaviour.
  let taxesUsd: number;
  if (HIGH_SURCHARGE_PROGRAMS.has(program)) {
    taxesUsd = rng.range(150, 100 + band * 180);
  } else if (LOW_SURCHARGE_PROGRAMS.has(program)) {
    taxesUsd = rng.range(5.6, 60);
  } else {
    taxesUsd = rng.range(25, 40 + band * 45);
  }
  taxesUsd = Math.round(taxesUsd * 100) / 100;

  const { valueCpp, discountPct } = computeValue({
    cashReferenceUsd,
    pointsCost,
    taxesUsd,
  });

  // Depart window: a multi-day bookable stretch inside the requested window.
  // All dates derive from the requested window and the seed, so results are
  // fully deterministic (no wall-clock reads).
  const windowDays = Math.max(1, daysBetween(window.start, window.end));
  const startOffset = rng.int(0, Math.max(0, windowDays - 1));
  const departStart = addDays(new Date(window.start + "T00:00:00Z"), startOffset);
  const departEnd = addDays(departStart, rng.int(0, 3));

  // seenAt/expiresAt anchored to UTC midnight today plus seeded offsets.
  const base = today();
  const seenAt = addDays(base, -rng.int(0, 2));
  const expiresAt = addDays(base, rng.int(2, 10));

  const isPremium = cabin !== "economy";

  return {
    id: `mock-${origin}-${destination}-${cabin}-${program}-${isoDate(departStart)}`,
    origin,
    destination,
    cabin,
    airlineProgram: program,
    airlineProgramName: AIRLINE_PROGRAM_NAME[program] ?? program,
    pointsCost,
    taxesUsd,
    cashReferenceUsd: Math.round(cashReferenceUsd * 100) / 100,
    valueCpp,
    discountPct,
    departWindowStart: isoDate(departStart),
    departWindowEnd: isoDate(departEnd),
    seatsRemaining: rng.int(1, 7),
    source: "mock",
    seenAt: seenAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isPremium,
  };
}

// Resolve the search window from a RouteQuery (single date or range).
function routeWindow(input: RouteQuery): DateRange {
  if (input.range) return input.range;
  if (input.date) return { start: input.date, end: input.date };
  const base = today();
  return { start: isoDate(base), end: isoDate(addDays(base, 60)) };
}

export class MockAwardDataProvider implements AwardDataProvider {
  async searchRoute(input: RouteQuery): Promise<AwardResult[]> {
    const window = routeWindow(input);
    const rng = new Rng(`${SEED}:route:${input.origin}:${input.destination}:${input.cabin}`);
    const count = rng.int(4, 9);
    const programs = rng.shuffle(ALL_PROGRAM_CODES).slice(0, count);

    const results = programs.map((program, i) =>
      makeAward(input.origin, input.destination, input.cabin, program, window, `route-${i}`),
    );
    return rankByValue(results);
  }

  async searchBulk(input: BulkQuery): Promise<AwardResult[]> {
    const origins = input.origins.slice(0, 6);
    const destinations = input.destinations.slice(0, 6);
    const cabins = input.cabins.length ? input.cabins : (["economy"] as Cabin[]);
    const perPair = input.maxPerPair ?? 2;
    const results: AwardResult[] = [];

    for (const origin of origins) {
      for (const destination of destinations) {
        if (origin === destination) continue;
        for (const cabin of cabins) {
          const rng = new Rng(`${SEED}:bulk:${origin}:${destination}:${cabin}`);
          const programs = rng.shuffle(ALL_PROGRAM_CODES).slice(0, perPair);
          programs.forEach((program, i) => {
            results.push(
              makeAward(origin, destination, cabin, program, input.window, `bulk-${i}`),
            );
          });
        }
      }
    }
    return rankByValue(results);
  }

  async getAvailability(filter: AlertFilter): Promise<AwardResult[]> {
    const sample = (xs: string[] | undefined, fallbackCount: number) =>
      xs && xs.length
        ? xs
        : new Rng(`${SEED}:avail`).shuffle(AIRPORTS.map((a) => a.iata)).slice(0, fallbackCount);

    const origins = sample(filter.origins, 4);
    const destinations = sample(filter.destinations, 4);
    const cabins = filter.cabins?.length ? filter.cabins : (["economy", "business"] as Cabin[]);
    const window =
      filter.window ?? { start: isoDate(today()), end: isoDate(addDays(today(), 365)) };

    const bulk = await this.searchBulk({
      origins,
      destinations,
      cabins,
      window,
      pax: 1,
      maxPerPair: 3,
    });

    return bulk.filter((r) => {
      if (filter.airlinePrograms?.length && !filter.airlinePrograms.includes(r.airlineProgram))
        return false;
      if (filter.minValueCpp != null && r.valueCpp < filter.minValueCpp) return false;
      if (filter.minDiscountPct != null && r.discountPct < filter.minDiscountPct) return false;
      if (filter.premiumOnly && !r.isPremium) return false;
      return true;
    });
  }
}

function rankByValue(results: AwardResult[]): AwardResult[] {
  return [...results].sort((a, b) => b.valueCpp - a.valueCpp);
}

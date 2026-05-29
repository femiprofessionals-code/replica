import type { Cabin, SubscriptionTier, DateRange } from "@/lib/types";
import { CABINS } from "@/lib/types";
import { today, addDays, isoDate, daysBetween } from "@/lib/award-data/dates";

// Premium gating policy, enforced server-side. This is the single source of
// truth for what each tier may search. Never gate by hiding UI alone.
export const FREE_WINDOW_DAYS = 90;
export const PREMIUM_WINDOW_DAYS = 365;
export const FREE_CABINS: Cabin[] = ["economy"];

export interface GateResult {
  cabins: Cabin[];
  window: DateRange;
  windowDays: number;
  cabinsClamped: boolean;
  windowClamped: boolean;
}

/**
 * Clamps a requested set of cabins and date window to what the tier allows.
 * Returns the allowed query plus flags so the UI can explain the limit.
 */
export function applyExplorerGate(
  tier: SubscriptionTier,
  requested: { cabins: Cabin[]; window?: DateRange },
): GateResult {
  const isPremium = tier === "premium";
  const maxDays = isPremium ? PREMIUM_WINDOW_DAYS : FREE_WINDOW_DAYS;

  const requestedCabins = requested.cabins.filter((c) => CABINS.includes(c));
  const allowedCabins = isPremium
    ? requestedCabins.length
      ? requestedCabins
      : (["economy"] as Cabin[])
    : FREE_CABINS;
  const cabinsClamped = !isPremium && requestedCabins.some((c) => c !== "economy");

  const base = today();
  const reqStart = requested.window?.start
    ? new Date(requested.window.start + "T00:00:00Z")
    : base;
  const start = reqStart > base ? reqStart : base;

  const maxEnd = addDays(start, maxDays);
  const reqEnd = requested.window?.end
    ? new Date(requested.window.end + "T00:00:00Z")
    : maxEnd;
  const end = reqEnd > maxEnd ? maxEnd : reqEnd;

  const window = { start: isoDate(start), end: isoDate(end) };
  const windowClamped =
    !!requested.window?.end && new Date(requested.window.end + "T00:00:00Z") > maxEnd;

  return {
    cabins: allowedCabins,
    window,
    windowDays: daysBetween(window.start, window.end),
    cabinsClamped,
    windowClamped,
  };
}

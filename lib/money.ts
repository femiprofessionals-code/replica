// All money math lives here. The rules (from the product spec):
//   value_cpp   = cash_reference_usd / points_cost * 100
//   discount_pct = how much cash you save vs paying the cash reference, where
//                  booking with points costs you only the taxes in cash.
// Keep full precision in storage; round only for display.

/** Cents-per-point value of an award. Higher is better. */
export function valueCpp(cashReferenceUsd: number, pointsCost: number): number {
  if (pointsCost <= 0) return 0;
  return (cashReferenceUsd / pointsCost) * 100;
}

/**
 * Percent saved versus paying cash. Booking the award costs `taxesUsd` out of
 * pocket instead of the full `cashReferenceUsd`, so the saving is the gap
 * between them, measured against the cash reference. Clamped to [0, 100].
 */
export function discountPct(cashReferenceUsd: number, taxesUsd: number): number {
  if (cashReferenceUsd <= 0) return 0;
  const raw = ((cashReferenceUsd - taxesUsd) / cashReferenceUsd) * 100;
  return Math.max(0, Math.min(100, raw));
}

export interface ComputedValue {
  valueCpp: number;
  discountPct: number;
}

/** Compute both derived numbers from the raw economics in one call. */
export function computeValue(input: {
  cashReferenceUsd: number;
  pointsCost: number;
  taxesUsd: number;
}): ComputedValue {
  return {
    valueCpp: valueCpp(input.cashReferenceUsd, input.pointsCost),
    discountPct: discountPct(input.cashReferenceUsd, input.taxesUsd),
  };
}

// ---- Display helpers (rounding happens only at the edge) ----

export function formatPoints(points: number): string {
  return Math.round(points).toLocaleString("en-US");
}

export function formatUsd(usd: number): string {
  return usd.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatCpp(cpp: number): string {
  return `${cpp.toFixed(1)}¢/pt`;
}

export function formatPct(pct: number): string {
  return `${Math.round(pct)}%`;
}

export type ValueTier = "great" | "fair" | "below";

/** Maps cpp to the value badge tier used across the UI. */
export function valueTier(cpp: number): ValueTier {
  if (cpp >= 1.8) return "great";
  if (cpp >= 1.0) return "fair";
  return "below";
}

export const VALUE_TIER_LABEL: Record<ValueTier, string> = {
  great: "Great value",
  fair: "Fair value",
  below: "Below cash",
};

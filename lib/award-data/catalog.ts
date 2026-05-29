import type { Cabin } from "@/lib/types";

// Static catalog the mock provider draws from. Real airports and realistic
// regional economics; no external calls.

export type Region = "NA" | "SA" | "EU" | "ME" | "AS" | "OC";

export interface Airport {
  iata: string;
  city: string;
  region: Region;
}

export const AIRPORTS: Airport[] = [
  { iata: "JFK", city: "New York", region: "NA" },
  { iata: "EWR", city: "Newark", region: "NA" },
  { iata: "BOS", city: "Boston", region: "NA" },
  { iata: "IAD", city: "Washington", region: "NA" },
  { iata: "ORD", city: "Chicago", region: "NA" },
  { iata: "MIA", city: "Miami", region: "NA" },
  { iata: "DFW", city: "Dallas", region: "NA" },
  { iata: "LAX", city: "Los Angeles", region: "NA" },
  { iata: "SFO", city: "San Francisco", region: "NA" },
  { iata: "SEA", city: "Seattle", region: "NA" },
  { iata: "YYZ", city: "Toronto", region: "NA" },
  { iata: "GRU", city: "Sao Paulo", region: "SA" },
  { iata: "EZE", city: "Buenos Aires", region: "SA" },
  { iata: "LHR", city: "London", region: "EU" },
  { iata: "CDG", city: "Paris", region: "EU" },
  { iata: "FRA", city: "Frankfurt", region: "EU" },
  { iata: "AMS", city: "Amsterdam", region: "EU" },
  { iata: "FCO", city: "Rome", region: "EU" },
  { iata: "DXB", city: "Dubai", region: "ME" },
  { iata: "DOH", city: "Doha", region: "ME" },
  { iata: "IST", city: "Istanbul", region: "ME" },
  { iata: "NRT", city: "Tokyo", region: "AS" },
  { iata: "HND", city: "Tokyo", region: "AS" },
  { iata: "SIN", city: "Singapore", region: "AS" },
  { iata: "HKG", city: "Hong Kong", region: "AS" },
  { iata: "BKK", city: "Bangkok", region: "AS" },
  { iata: "SYD", city: "Sydney", region: "OC" },
  { iata: "AKL", city: "Auckland", region: "OC" },
];

export const AIRPORT_BY_IATA: Record<string, Airport> = Object.fromEntries(
  AIRPORTS.map((a) => [a.iata, a]),
);

export function airportCity(iata: string): string {
  return AIRPORT_BY_IATA[iata]?.city ?? iata;
}

// Distance band between two regions, used to scale points and cash. 0 = within
// region (short), higher = longer haul.
const REGION_BAND: Record<Region, Record<Region, number>> = {
  NA: { NA: 0, SA: 1, EU: 2, ME: 3, AS: 3, OC: 3 },
  SA: { NA: 1, SA: 0, EU: 2, ME: 3, AS: 3, OC: 3 },
  EU: { NA: 2, SA: 2, EU: 0, ME: 1, AS: 2, OC: 3 },
  ME: { NA: 3, SA: 3, EU: 1, ME: 0, AS: 1, OC: 2 },
  AS: { NA: 3, SA: 3, EU: 2, ME: 1, AS: 0, OC: 1 },
  OC: { NA: 3, SA: 3, EU: 3, ME: 2, AS: 1, OC: 0 },
};

export function haulBand(origin: string, destination: string): number {
  const o = AIRPORT_BY_IATA[origin];
  const d = AIRPORT_BY_IATA[destination];
  if (!o || !d) return 2;
  return REGION_BAND[o.region][d.region];
}

// Base one-way economy miles per haul band; other cabins scale up.
const BASE_MILES_BY_BAND = [7500, 17500, 35000, 50000];

const CABIN_MULTIPLIER: Record<Cabin, number> = {
  economy: 1,
  premium: 1.5,
  business: 2.4,
  first: 3.6,
};

// Cash reference (USD) anchor per band/cabin, before per-result variance.
// Tuned so economy lands near 1.5 cpp, premium ~2, business ~3, first ~3.7.
const BASE_CASH_BY_BAND = [120, 280, 520, 780];
const CABIN_CASH_MULTIPLIER: Record<Cabin, number> = {
  economy: 1,
  premium: 2.0,
  business: 4.5,
  first: 8.5,
};

export function baseMiles(band: number, cabin: Cabin): number {
  return BASE_MILES_BY_BAND[Math.min(band, 3)] * CABIN_MULTIPLIER[cabin];
}

export function baseCashUsd(band: number, cabin: Cabin): number {
  return BASE_CASH_BY_BAND[Math.min(band, 3)] * CABIN_CASH_MULTIPLIER[cabin];
}

// Programs that tend to add fuel surcharges (higher taxes) vs. those that do not.
export const HIGH_SURCHARGE_PROGRAMS = new Set(["EK_SKYWARDS", "BA_AVIOS"]);
export const LOW_SURCHARGE_PROGRAMS = new Set([
  "AV_LIFEMILES",
  "UA_MP",
  "AC_AEROPLAN",
]);

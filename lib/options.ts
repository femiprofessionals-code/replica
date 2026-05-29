import { AIRPORTS } from "@/lib/award-data/catalog";
import { POINTS_PROGRAMS } from "@/lib/reference-data";
import { CABINS, CABIN_LABEL } from "@/lib/types";

// Select/checkbox option lists derived from the catalog and reference data, so
// the UI can never drift from what the provider understands.

export const AIRPORT_OPTIONS = AIRPORTS.map((a) => ({
  value: a.iata,
  label: `${a.city} (${a.iata})`,
})).sort((a, b) => a.label.localeCompare(b.label));

export const CABIN_OPTIONS = CABINS.map((c) => ({ value: c, label: CABIN_LABEL[c] }));

export const POINTS_PROGRAM_OPTIONS = POINTS_PROGRAMS.map((p) => ({
  value: p.code,
  label: p.displayName,
}));

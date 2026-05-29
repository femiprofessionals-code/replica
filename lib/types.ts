// Core domain types for ClearPoints. These are the contract the whole app is
// built against. The award-data provider returns AwardResult[]; every feature
// consumes these shapes, never a vendor's raw response.

export type Cabin = "economy" | "premium" | "business" | "first";

export const CABINS: Cabin[] = ["economy", "premium", "business", "first"];

export const CABIN_LABEL: Record<Cabin, string> = {
  economy: "Economy",
  premium: "Premium Economy",
  business: "Business",
  first: "First",
};

// Bank / card points programs a user holds. Matches points_programs.code seed.
export type PointsProgramCode =
  | "AMEX_MR"
  | "CHASE_UR"
  | "CAPONE"
  | "CITI_TY"
  | "BILT"
  | "BREX"
  | "WF";

export type SubscriptionTier = "free" | "premium";

// A bookable airline loyalty program (the thing you actually spend miles in).
export type AirlineProgramCode = string;

// ---------------------------------------------------------------------------
// Provider query shapes
// ---------------------------------------------------------------------------

export interface DateRange {
  start: string; // ISO date (YYYY-MM-DD)
  end: string; // ISO date (YYYY-MM-DD)
}

export interface RouteQuery {
  origin: string; // IATA code
  destination: string; // IATA code
  /** A single date, or a range. Provide one of them. */
  date?: string;
  range?: DateRange;
  cabin: Cabin;
  pax: number;
}

export interface BulkQuery {
  origins: string[]; // up to 6 IATA codes
  destinations: string[]; // up to 6 IATA codes
  cabins: Cabin[];
  window: DateRange;
  pax: number;
  /** Cap results returned per origin/destination pair. */
  maxPerPair?: number;
}

// Used by getAvailability (powers Flight Alerts in a later phase).
export interface AlertFilter {
  origins?: string[];
  destinations?: string[];
  cabins?: Cabin[];
  airlinePrograms?: AirlineProgramCode[];
  window?: DateRange;
  minValueCpp?: number;
  minDiscountPct?: number;
  premiumOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Provider result shape (mirrors the `deals` table columns)
// ---------------------------------------------------------------------------

export interface AwardResult {
  id: string;
  origin: string;
  destination: string;
  cabin: Cabin;
  airlineProgram: AirlineProgramCode;
  airlineProgramName: string;
  // Raw economics: the source of truth. Never model-generated.
  pointsCost: number;
  taxesUsd: number;
  cashReferenceUsd: number;
  // Derived (computed via lib/money.ts from the raw economics above).
  valueCpp: number;
  discountPct: number;
  // Availability window for this fare.
  departWindowStart: string; // ISO date
  departWindowEnd: string; // ISO date
  seatsRemaining: number;
  source: string; // "mock" | "seatsaero" | ...
  seenAt: string; // ISO timestamp
  expiresAt: string; // ISO timestamp
  isPremium: boolean;
}

// A rendered booking instruction set (from booking_instruction_templates).
export interface BookingInstructions {
  airlineProgram: AirlineProgramCode;
  airlineProgramName: string;
  steps: string[];
}

// Resolved path from a user's bank program to a bookable airline program.
export interface TransferPath {
  fromProgram: PointsProgramCode;
  fromProgramName: string;
  toAirlineProgram: AirlineProgramCode;
  toAirlineProgramName: string;
  ratio: string; // e.g. "1:1", "1000:1250"
  transferTime: string; // e.g. "Instant", "1-2 days"
}

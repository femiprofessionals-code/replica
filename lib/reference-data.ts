import type { PointsProgramCode } from "@/lib/types";

// ---------------------------------------------------------------------------
// Reference data seeded into Supabase and used at runtime to resolve transfer
// paths. Values are real-world-accurate as of 2026 to the best of our
// knowledge. This file is the single source of truth; supabase/seed.sql is
// generated to match it (see scripts/gen-seed-sql.ts).
// ---------------------------------------------------------------------------

export interface PointsProgram {
  code: PointsProgramCode;
  displayName: string;
  type: "bank";
}

export const POINTS_PROGRAMS: PointsProgram[] = [
  { code: "AMEX_MR", displayName: "American Express Membership Rewards", type: "bank" },
  { code: "CHASE_UR", displayName: "Chase Ultimate Rewards", type: "bank" },
  { code: "CAPONE", displayName: "Capital One Miles", type: "bank" },
  { code: "CITI_TY", displayName: "Citi ThankYou Points", type: "bank" },
  { code: "BILT", displayName: "Bilt Rewards", type: "bank" },
  { code: "BREX", displayName: "Brex Rewards", type: "bank" },
  { code: "WF", displayName: "Wells Fargo Rewards", type: "bank" },
];

export interface AirlineProgram {
  code: string;
  displayName: string;
  alliance: "Star Alliance" | "Oneworld" | "SkyTeam" | "None";
}

export const AIRLINE_PROGRAMS: AirlineProgram[] = [
  { code: "UA_MP", displayName: "United MileagePlus", alliance: "Star Alliance" },
  { code: "AC_AEROPLAN", displayName: "Air Canada Aeroplan", alliance: "Star Alliance" },
  { code: "AV_LIFEMILES", displayName: "Avianca LifeMiles", alliance: "Star Alliance" },
  { code: "SQ_KRISFLYER", displayName: "Singapore KrisFlyer", alliance: "Star Alliance" },
  { code: "TK_MILESSMILES", displayName: "Turkish Miles&Smiles", alliance: "Star Alliance" },
  { code: "AA_AADVANTAGE", displayName: "American AAdvantage", alliance: "Oneworld" },
  { code: "BA_AVIOS", displayName: "British Airways Executive Club", alliance: "Oneworld" },
  { code: "QR_PRIVILEGE", displayName: "Qatar Airways Privilege Club", alliance: "Oneworld" },
  { code: "AS_MILEAGEPLAN", displayName: "Alaska Mileage Plan", alliance: "Oneworld" },
  { code: "AF_FLYINGBLUE", displayName: "Air France-KLM Flying Blue", alliance: "SkyTeam" },
  { code: "DL_SKYMILES", displayName: "Delta SkyMiles", alliance: "SkyTeam" },
  { code: "VS_FLYINGCLUB", displayName: "Virgin Atlantic Flying Club", alliance: "None" },
  { code: "EK_SKYWARDS", displayName: "Emirates Skywards", alliance: "None" },
  { code: "B6_TRUEBLUE", displayName: "JetBlue TrueBlue", alliance: "None" },
];

export const AIRLINE_PROGRAM_NAME: Record<string, string> = Object.fromEntries(
  AIRLINE_PROGRAMS.map((p) => [p.code, p.displayName]),
);

export interface TransferPartner {
  fromProgram: PointsProgramCode;
  toAirlineProgram: string;
  ratio: string; // "1:1", "5:4" (1000 from -> 800 to), etc.
  transferTime: string; // "Instant", "1-2 days"
  active: boolean;
}

// Curated transferable-currency relationships. Not exhaustive, but accurate.
export const TRANSFER_PARTNERS: TransferPartner[] = [
  // Chase Ultimate Rewards
  { fromProgram: "CHASE_UR", toAirlineProgram: "UA_MP", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CHASE_UR", toAirlineProgram: "AC_AEROPLAN", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CHASE_UR", toAirlineProgram: "AF_FLYINGBLUE", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CHASE_UR", toAirlineProgram: "VS_FLYINGCLUB", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CHASE_UR", toAirlineProgram: "BA_AVIOS", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CHASE_UR", toAirlineProgram: "SQ_KRISFLYER", ratio: "1:1", transferTime: "1-2 days", active: true },
  { fromProgram: "CHASE_UR", toAirlineProgram: "B6_TRUEBLUE", ratio: "1:1", transferTime: "Instant", active: true },
  // Amex Membership Rewards
  { fromProgram: "AMEX_MR", toAirlineProgram: "AC_AEROPLAN", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "AMEX_MR", toAirlineProgram: "AF_FLYINGBLUE", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "AMEX_MR", toAirlineProgram: "VS_FLYINGCLUB", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "AMEX_MR", toAirlineProgram: "BA_AVIOS", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "AMEX_MR", toAirlineProgram: "DL_SKYMILES", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "AMEX_MR", toAirlineProgram: "SQ_KRISFLYER", ratio: "1:1", transferTime: "1-2 days", active: true },
  { fromProgram: "AMEX_MR", toAirlineProgram: "EK_SKYWARDS", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "AMEX_MR", toAirlineProgram: "B6_TRUEBLUE", ratio: "5:4", transferTime: "Instant", active: true },
  // Capital One Miles
  { fromProgram: "CAPONE", toAirlineProgram: "AC_AEROPLAN", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CAPONE", toAirlineProgram: "AF_FLYINGBLUE", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CAPONE", toAirlineProgram: "VS_FLYINGCLUB", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CAPONE", toAirlineProgram: "AV_LIFEMILES", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CAPONE", toAirlineProgram: "SQ_KRISFLYER", ratio: "1:1", transferTime: "1-2 days", active: true },
  { fromProgram: "CAPONE", toAirlineProgram: "TK_MILESSMILES", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CAPONE", toAirlineProgram: "EK_SKYWARDS", ratio: "1:1", transferTime: "Instant", active: true },
  // Citi ThankYou
  { fromProgram: "CITI_TY", toAirlineProgram: "AF_FLYINGBLUE", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CITI_TY", toAirlineProgram: "VS_FLYINGCLUB", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CITI_TY", toAirlineProgram: "AV_LIFEMILES", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CITI_TY", toAirlineProgram: "SQ_KRISFLYER", ratio: "1:1", transferTime: "1-2 days", active: true },
  { fromProgram: "CITI_TY", toAirlineProgram: "TK_MILESSMILES", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CITI_TY", toAirlineProgram: "EK_SKYWARDS", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "CITI_TY", toAirlineProgram: "B6_TRUEBLUE", ratio: "1:1", transferTime: "Instant", active: true },
  // Bilt Rewards
  { fromProgram: "BILT", toAirlineProgram: "AA_AADVANTAGE", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "BILT", toAirlineProgram: "AC_AEROPLAN", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "BILT", toAirlineProgram: "AF_FLYINGBLUE", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "BILT", toAirlineProgram: "AS_MILEAGEPLAN", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "BILT", toAirlineProgram: "TK_MILESSMILES", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "BILT", toAirlineProgram: "VS_FLYINGCLUB", ratio: "1:1", transferTime: "Instant", active: true },
  // Brex Rewards
  { fromProgram: "BREX", toAirlineProgram: "AF_FLYINGBLUE", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "BREX", toAirlineProgram: "AV_LIFEMILES", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "BREX", toAirlineProgram: "SQ_KRISFLYER", ratio: "1:1", transferTime: "1-2 days", active: true },
  // Wells Fargo Rewards
  { fromProgram: "WF", toAirlineProgram: "AF_FLYINGBLUE", ratio: "1:1", transferTime: "Instant", active: true },
  { fromProgram: "WF", toAirlineProgram: "AV_LIFEMILES", ratio: "1:1", transferTime: "Instant", active: true },
];

export interface BookingInstructionTemplate {
  airlineProgram: string;
  // Steps may contain placeholders: {program} {origin} {destination} {date}
  // {cabin} {points} {taxes}. Rendered by lib/booking-instructions.ts.
  steps: string[];
}

const GENERIC_STEPS = (extra: string): string[] => [
  "If your miles are sitting as bank points, transfer them to {program} first. Transfers are usually instant but can take up to 2 days, so never transfer until you confirm the seat is bookable.",
  "Log in to your {program} account and open the award or miles search.",
  "Search award space from {origin} to {destination} around {date} in {cabin}.",
  extra,
  "Confirm the price is near {points} miles plus about {taxes} in taxes and fees.",
  "Add passenger details and ticket the award before the hold expires.",
];

export const BOOKING_INSTRUCTION_TEMPLATES: BookingInstructionTemplate[] = [
  { airlineProgram: "UA_MP", steps: GENERIC_STEPS("United shows partner space online; filter for Saver awards to match the quoted price.") },
  { airlineProgram: "AC_AEROPLAN", steps: GENERIC_STEPS("Aeroplan prices by distance, so the quoted miles should match the route band shown.") },
  { airlineProgram: "AV_LIFEMILES", steps: GENERIC_STEPS("LifeMiles often has no fuel surcharges, which keeps the taxes low as shown.") },
  { airlineProgram: "SQ_KRISFLYER", steps: GENERIC_STEPS("Singapore's own metal and Star partners appear in KrisFlyer search; Saver space matches the quote.") },
  { airlineProgram: "TK_MILESSMILES", steps: GENERIC_STEPS("Turkish online search can be patchy; if the seat does not show, call to ticket Star partner space.") },
  { airlineProgram: "AA_AADVANTAGE", steps: GENERIC_STEPS("Look for MileSAAver pricing; web specials may be lower than the quote.") },
  { airlineProgram: "BA_AVIOS", steps: GENERIC_STEPS("Avios pricing is per segment and distance based, so short hops are cheap and long hauls cost more.") },
  { airlineProgram: "QR_PRIVILEGE", steps: GENERIC_STEPS("Qatar Avios and Privilege Club share an account; Qsuite business space matches the quote.") },
  { airlineProgram: "AS_MILEAGEPLAN", steps: GENERIC_STEPS("Alaska partner awards are often best by phone if a partner segment does not show online.") },
  { airlineProgram: "AF_FLYINGBLUE", steps: GENERIC_STEPS("Flying Blue Promo Rewards rotate monthly and can beat the quoted price on featured routes.") },
  { airlineProgram: "DL_SKYMILES", steps: GENERIC_STEPS("SkyMiles has no award chart, so confirm the dynamic price matches the quote before transferring.") },
  { airlineProgram: "VS_FLYINGCLUB", steps: GENERIC_STEPS("Virgin charges fewer miles on partners like Delta and ANA; confirm the partner before booking.") },
  { airlineProgram: "EK_SKYWARDS", steps: GENERIC_STEPS("Emirates carries fuel surcharges, so expect the higher taxes shown on this award.") },
  { airlineProgram: "B6_TRUEBLUE", steps: GENERIC_STEPS("JetBlue pricing tracks the cash fare, so book when the points price is near the quote.") },
];

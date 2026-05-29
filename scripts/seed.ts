/**
 * Seeds Supabase from a single source of truth:
 *   - reference tables from lib/reference-data.ts
 *   - deals from the MockAwardDataProvider (deterministic)
 *
 * Usage:  npm run seed
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  POINTS_PROGRAMS,
  TRANSFER_PARTNERS,
  BOOKING_INSTRUCTION_TEMPLATES,
} from "../lib/reference-data";
import { MockAwardDataProvider } from "../lib/award-data/mock-provider";
import { renderBookingInstructions } from "../lib/booking-instructions";
import { isoDate, today, addDays } from "../lib/award-data/dates";
import { CABINS } from "../lib/types";

// Minimal .env.local loader (no dependency needed).
function loadEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.local.",
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

async function seedReference() {
  console.log("Seeding points_programs...");
  await db.from("points_programs").upsert(
    POINTS_PROGRAMS.map((p) => ({ code: p.code, display_name: p.displayName, type: p.type })),
    { onConflict: "code" },
  );

  console.log("Seeding transfer_partners...");
  await db.from("transfer_partners").upsert(
    TRANSFER_PARTNERS.map((t) => ({
      from_program: t.fromProgram,
      to_airline_program: t.toAirlineProgram,
      ratio: t.ratio,
      transfer_time: t.transferTime,
      active: t.active,
    })),
    { onConflict: "from_program,to_airline_program" },
  );

  console.log("Seeding booking_instruction_templates...");
  await db.from("booking_instruction_templates").upsert(
    BOOKING_INSTRUCTION_TEMPLATES.map((t) => ({
      airline_program: t.airlineProgram,
      steps: t.steps,
    })),
    { onConflict: "airline_program" },
  );
}

async function seedDeals() {
  console.log("Generating mock deals...");
  const provider = new MockAwardDataProvider();
  const window = { start: isoDate(today()), end: isoDate(addDays(today(), 365)) };

  const results = await provider.searchBulk({
    origins: ["JFK", "EWR", "BOS", "SFO", "LAX", "ORD"],
    destinations: ["LHR", "CDG", "NRT", "SIN", "DXB", "GRU"],
    cabins: CABINS,
    window,
    pax: 1,
    maxPerPair: 2,
  });

  const rows = results.map((r) => ({
    origin: r.origin,
    destination: r.destination,
    cabin: r.cabin,
    airline_program: r.airlineProgram,
    points_cost: r.pointsCost,
    taxes_usd: r.taxesUsd,
    cash_reference_usd: r.cashReferenceUsd,
    value_cpp: r.valueCpp,
    discount_pct: r.discountPct,
    depart_window_start: r.departWindowStart,
    depart_window_end: r.departWindowEnd,
    booking_instructions: renderBookingInstructions(r),
    source: r.source,
    seen_at: r.seenAt,
    expires_at: r.expiresAt,
    is_premium: r.isPremium,
  }));

  console.log(`Replacing deals with ${rows.length} mock rows...`);
  await db.from("deals").delete().eq("source", "mock");
  const { error } = await db.from("deals").insert(rows);
  if (error) throw error;
}

async function main() {
  await seedReference();
  await seedDeals();
  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Hand-written database types for the Phase 1 tables we query. Kept small and
// focused; regenerate with the Supabase CLI as the schema grows.
import type { Cabin, PointsProgramCode, SubscriptionTier } from "@/lib/types";

export interface UsersProfileRow {
  id: string;
  home_airports: string[];
  points_programs: PointsProgramCode[];
  cabin_pref: Cabin;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface DealRow {
  id: string;
  origin: string;
  destination: string;
  cabin: Cabin;
  airline_program: string;
  points_cost: number;
  taxes_usd: number;
  cash_reference_usd: number;
  value_cpp: number;
  discount_pct: number;
  depart_window_start: string;
  depart_window_end: string;
  booking_instructions: unknown;
  source: string;
  seen_at: string;
  expires_at: string | null;
  is_premium: boolean;
  created_at: string;
}

export interface TransferPartnerRow {
  id: number;
  from_program: PointsProgramCode;
  to_airline_program: string;
  ratio: string;
  transfer_time: string;
  active: boolean;
}

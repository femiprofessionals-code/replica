import type { AwardDataProvider } from "./provider";
import { MockAwardDataProvider } from "./mock-provider";
import { SeatsAeroProvider } from "./seatsaero-provider";

// Single place the provider is chosen. Features import getProvider(), never a
// concrete class, so swapping vendors is one env var.
let cached: AwardDataProvider | null = null;

export function getProvider(): AwardDataProvider {
  if (cached) return cached;
  const which = (process.env.AWARD_PROVIDER ?? "mock").toLowerCase();
  cached = which === "seatsaero" ? new SeatsAeroProvider() : new MockAwardDataProvider();
  return cached;
}

export type { AwardDataProvider } from "./provider";

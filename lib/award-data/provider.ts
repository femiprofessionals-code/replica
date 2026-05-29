import type {
  RouteQuery,
  BulkQuery,
  AlertFilter,
  AwardResult,
} from "@/lib/types";

// The single interface the entire app is built against. Phase 1 ships a
// MockAwardDataProvider; a SeatsAeroProvider implements the same contract and
// is selected by the AWARD_PROVIDER env var (see ./index.ts). No feature ever
// talks to a vendor SDK directly.
export interface AwardDataProvider {
  searchRoute(input: RouteQuery): Promise<AwardResult[]>;
  searchBulk(input: BulkQuery): Promise<AwardResult[]>; // multi-origin/dest
  getAvailability(filter: AlertFilter): Promise<AwardResult[]>;
}

export type {
  RouteQuery,
  BulkQuery,
  AlertFilter,
  AwardResult,
} from "@/lib/types";

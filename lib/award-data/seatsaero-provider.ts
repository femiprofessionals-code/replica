import type { AwardDataProvider } from "./provider";
import type { AwardResult, BulkQuery, RouteQuery, AlertFilter } from "@/lib/types";

/**
 * SeatsAeroProvider
 * -----------------
 * Phase 2+ implementation of AwardDataProvider backed by the seats.aero
 * Partner API. Stubbed here so the app is provider-swap ready: set
 * AWARD_PROVIDER=seatsaero and supply SEATS_AERO_API_KEY to switch with no
 * changes to any feature code.
 *
 * Expected request/response mapping (documented now, wired later):
 *
 * searchRoute(input):
 *   GET {SEATS_AERO_BASE_URL}/search
 *     headers: { "Partner-Authorization": SEATS_AERO_API_KEY }
 *     query:   origin_airport=input.origin
 *              destination_airport=input.destination
 *              start_date=input.range?.start ?? input.date
 *              end_date=input.range?.end ?? input.date
 *              cabin=mapCabin(input.cabin)         // economy|premium|business|first
 *   response.data[] (Availability objects) -> AwardResult:
 *     id                 <- entry.ID
 *     origin             <- entry.Route.OriginAirport
 *     destination        <- entry.Route.DestinationAirport
 *     cabin              <- from the *MileageCost field that is set
 *     airlineProgram     <- entry.Source (e.g. "united" -> "UA_MP")  // see mapSource()
 *     pointsCost         <- entry.{Cabin}MileageCost
 *     taxesUsd           <- entry.{Cabin}TotalTaxes / 100  (API returns cents)
 *     cashReferenceUsd   <- sourced separately in Phase 2 (cash-reference table)
 *     valueCpp/discountPct <- computed via lib/money.ts (never from the vendor)
 *     departWindowStart/End <- entry.Date (single day) widened by availability
 *     seatsRemaining     <- entry.{Cabin}RemainingSeats
 *     source             <- "seatsaero"
 *     seenAt             <- entry.UpdatedAt
 *     expiresAt          <- entry.UpdatedAt + freshness window
 *     isPremium          <- cabin !== "economy"
 *
 * searchBulk(input):  POST {base}/search with origin/destination arrays (or fan
 *   out searchRoute per pair, capped 6x6) and merge.
 *
 * getAvailability(filter): GET {base}/availability with the cached-trips
 *   endpoint, then apply the same filter logic as the mock provider.
 *
 * Money rule holds across providers: we always recompute value_cpp and
 * discount_pct locally from raw economics. The vendor never supplies value.
 */
export class SeatsAeroProvider implements AwardDataProvider {
  constructor(
    private readonly apiKey: string = process.env.SEATS_AERO_API_KEY ?? "",
    private readonly baseUrl: string = process.env.SEATS_AERO_BASE_URL ??
      "https://seats.aero/partnerapi",
  ) {}

  // TODO(phase-2): implement against the seats.aero Partner API per the mapping above.
  async searchRoute(_input: RouteQuery): Promise<AwardResult[]> {
    throw new Error(
      "SeatsAeroProvider.searchRoute not implemented. Set AWARD_PROVIDER=mock for Phase 1.",
    );
  }

  async searchBulk(_input: BulkQuery): Promise<AwardResult[]> {
    throw new Error(
      "SeatsAeroProvider.searchBulk not implemented. Set AWARD_PROVIDER=mock for Phase 1.",
    );
  }

  async getAvailability(_filter: AlertFilter): Promise<AwardResult[]> {
    throw new Error(
      "SeatsAeroProvider.getAvailability not implemented. Set AWARD_PROVIDER=mock for Phase 1.",
    );
  }
}

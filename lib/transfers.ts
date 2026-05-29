import type { PointsProgramCode, TransferPath } from "@/lib/types";
import {
  TRANSFER_PARTNERS,
  POINTS_PROGRAMS,
  AIRLINE_PROGRAM_NAME,
} from "@/lib/reference-data";

const PROGRAM_NAME: Record<string, string> = Object.fromEntries(
  POINTS_PROGRAMS.map((p) => [p.code, p.displayName]),
);

/**
 * Given the bank programs a user holds and a bookable airline program, return
 * every active transfer path that gets them there. This is how we tie a deal
 * to the user's own wallet.
 */
export function resolveTransferPaths(
  userPrograms: PointsProgramCode[],
  airlineProgram: string,
): TransferPath[] {
  const held = new Set(userPrograms);
  return TRANSFER_PARTNERS.filter(
    (tp) => tp.active && tp.toAirlineProgram === airlineProgram && held.has(tp.fromProgram),
  ).map((tp) => ({
    fromProgram: tp.fromProgram,
    fromProgramName: PROGRAM_NAME[tp.fromProgram] ?? tp.fromProgram,
    toAirlineProgram: tp.toAirlineProgram,
    toAirlineProgramName: AIRLINE_PROGRAM_NAME[tp.toAirlineProgram] ?? tp.toAirlineProgram,
    ratio: tp.ratio,
    transferTime: tp.transferTime,
  }));
}

/** True if the user can reach this airline program from any of their banks. */
export function canReach(
  userPrograms: PointsProgramCode[],
  airlineProgram: string,
): boolean {
  return resolveTransferPaths(userPrograms, airlineProgram).length > 0;
}

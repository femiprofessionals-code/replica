import type { AwardResult, BookingInstructions } from "@/lib/types";
import { CABIN_LABEL } from "@/lib/types";
import { BOOKING_INSTRUCTION_TEMPLATES } from "@/lib/reference-data";
import { AIRLINE_PROGRAM_NAME } from "@/lib/reference-data";
import { formatPoints, formatUsd } from "@/lib/money";
import { airportCity } from "@/lib/award-data/catalog";

const TEMPLATE_BY_PROGRAM = Object.fromEntries(
  BOOKING_INSTRUCTION_TEMPLATES.map((t) => [t.airlineProgram, t]),
);

function fillPlaceholders(step: string, vars: Record<string, string>): string {
  return step.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
}

/**
 * Render step-by-step booking instructions for a result from its airline
 * program template. Placeholders are filled from data only, never a model.
 */
export function renderBookingInstructions(result: AwardResult): BookingInstructions {
  const template =
    TEMPLATE_BY_PROGRAM[result.airlineProgram] ?? BOOKING_INSTRUCTION_TEMPLATES[0];

  const dateLabel =
    result.departWindowStart === result.departWindowEnd
      ? result.departWindowStart
      : `${result.departWindowStart} to ${result.departWindowEnd}`;

  const vars: Record<string, string> = {
    program: AIRLINE_PROGRAM_NAME[result.airlineProgram] ?? result.airlineProgram,
    origin: `${airportCity(result.origin)} (${result.origin})`,
    destination: `${airportCity(result.destination)} (${result.destination})`,
    date: dateLabel,
    cabin: CABIN_LABEL[result.cabin],
    points: formatPoints(result.pointsCost),
    taxes: formatUsd(result.taxesUsd),
  };

  return {
    airlineProgram: result.airlineProgram,
    airlineProgramName: vars.program,
    steps: template.steps.map((s) => fillPlaceholders(s, vars)),
  };
}

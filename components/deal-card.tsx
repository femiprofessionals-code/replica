import { Plane, Tag, Armchair } from "lucide-react";
import { Card, Chip, Badge } from "@/components/ui";
import { ValueBadge } from "@/components/value-badge";
import { TransferPaths } from "@/components/transfer-path";
import { BookingInstructionsDisclosure } from "@/components/booking-instructions";
import type { AwardResult, PointsProgramCode } from "@/lib/types";
import { CABIN_LABEL } from "@/lib/types";
import { formatPoints, formatUsd, formatPct } from "@/lib/money";
import { resolveTransferPaths } from "@/lib/transfers";
import { renderBookingInstructions } from "@/lib/booking-instructions";
import { airportCity } from "@/lib/award-data/catalog";

// Server component. Resolves transfer paths against the user's programs and
// renders generated booking instructions. Every number comes from the result.
export function DealCard({
  result,
  userPrograms,
}: {
  result: AwardResult;
  userPrograms: PointsProgramCode[];
}) {
  const paths = resolveTransferPaths(userPrograms, result.airlineProgram);
  const instructions = renderBookingInstructions(result);

  return (
    <Card interactive className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
            <Plane className="size-4 text-secondary" aria-hidden />
            {airportCity(result.origin)} to {airportCity(result.destination)}
          </h3>
          <p className="text-sm text-muted">
            {result.origin} to {result.destination} · {result.airlineProgramName}
          </p>
        </div>
        <Chip className="shrink-0">
          <Armchair className="size-3.5" aria-hidden /> {CABIN_LABEL[result.cabin]}
        </Chip>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-lg bg-background p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Points cost</p>
          <p className="tnum text-3xl font-bold text-primary">
            {formatPoints(result.pointsCost)}
          </p>
          <p className="tnum text-sm text-muted">
            plus {formatUsd(result.taxesUsd)} in taxes
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-muted">Cash reference</p>
          <p className="tnum text-xl font-semibold text-text">
            {formatUsd(result.cashReferenceUsd)}
          </p>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <ValueBadge cpp={result.valueCpp} />
            <Badge tone="gold">
              <Tag className="size-3" aria-hidden />
              <span className="tnum">{formatPct(result.discountPct)} off cash</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
        <span>
          Bookable{" "}
          <span className="tnum font-medium text-text">
            {result.departWindowStart}
            {result.departWindowEnd !== result.departWindowStart
              ? ` to ${result.departWindowEnd}`
              : ""}
          </span>
        </span>
        <span className="tnum">{result.seatsRemaining} seats left</span>
        {result.isPremium ? <Badge tone="navy">Premium cabin</Badge> : null}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Your transfer path
        </p>
        <TransferPaths paths={paths} />
      </div>

      <BookingInstructionsDisclosure instructions={instructions} />
    </Card>
  );
}

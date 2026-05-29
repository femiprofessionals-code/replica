import { ArrowRight } from "lucide-react";
import { Chip } from "@/components/ui";
import type { TransferPath } from "@/lib/types";

// Renders how a user's bank points reach the bookable airline program.
export function TransferPaths({ paths }: { paths: TransferPath[] }) {
  if (paths.length === 0) {
    return (
      <p className="text-sm text-muted">
        None of your current programs transfer here. Add a program in your account, or look
        for a deal on a program you hold.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {paths.map((p) => (
        <li key={p.fromProgram} className="flex flex-wrap items-center gap-2 text-sm">
          <Chip>{p.fromProgramName}</Chip>
          <span className="flex items-center gap-1 text-muted">
            <ArrowRight className="size-3.5" aria-hidden />
            <span className="tnum font-medium text-text">{p.ratio}</span>
          </span>
          <Chip className="border-secondary/30 bg-secondary/5 text-secondary">
            {p.toAirlineProgramName}
          </Chip>
          <span className="text-xs text-muted">{p.transferTime}</span>
        </li>
      ))}
    </ul>
  );
}

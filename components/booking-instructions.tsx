import { ChevronDown, ListChecks } from "lucide-react";
import type { BookingInstructions } from "@/lib/types";

// Uses a native <details> disclosure so it works without client JS and stays
// keyboard accessible.
export function BookingInstructionsDisclosure({
  instructions,
}: {
  instructions: BookingInstructions;
}) {
  return (
    <details className="group rounded-lg border border-border bg-background/60 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-primary">
        <span className="flex items-center gap-2">
          <ListChecks className="size-4 text-secondary" aria-hidden />
          How to book with {instructions.airlineProgramName}
        </span>
        <ChevronDown
          className="size-4 text-muted transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <ol className="flex list-decimal flex-col gap-2 px-8 pb-4 text-sm text-muted">
        {instructions.steps.map((step, i) => (
          <li key={i} className="pl-1 leading-relaxed">
            {step}
          </li>
        ))}
      </ol>
    </details>
  );
}

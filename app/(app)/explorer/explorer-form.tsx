"use client";

import { Compass } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { MultiCheck } from "@/components/multi-check";
import { AIRPORT_OPTIONS, CABIN_OPTIONS } from "@/lib/options";

type Defaults = {
  origins: string[];
  destinations: string[];
  cabins: string[];
  windowStart?: string;
  windowEnd?: string;
};

// GET form. Arrays (origins/destinations/cabins) post as repeated params, which
// the server page reads from searchParams. The server enforces the tier gate.
export function ExplorerForm({
  defaults,
  premium,
}: {
  defaults: Defaults;
  premium: boolean;
}) {
  const cabinOptions = premium
    ? CABIN_OPTIONS
    : CABIN_OPTIONS.map((c) =>
        c.value === "economy" ? c : { ...c, label: `${c.label} (Premium)` },
      );

  return (
    <form
      method="get"
      action="/explorer"
      className="flex flex-col gap-6 rounded-xl border border-border bg-surface p-5 shadow-sm"
    >
      <Field label="Origins (up to 6)" hint="Defaults to your home airports.">
        <MultiCheck name="origins" options={AIRPORT_OPTIONS} defaultSelected={defaults.origins} />
      </Field>

      <Field label="Destinations (up to 6)">
        <MultiCheck
          name="destinations"
          options={AIRPORT_OPTIONS}
          defaultSelected={defaults.destinations}
        />
      </Field>

      <Field
        label="Cabins"
        hint={premium ? undefined : "Free plan searches economy. Premium unlocks every cabin."}
      >
        <MultiCheck name="cabins" options={cabinOptions} defaultSelected={defaults.cabins} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Earliest date"
          hint={premium ? "Up to 365 days out." : "Free plan covers the next 90 days."}
        >
          <Input type="date" name="windowStart" defaultValue={defaults.windowStart} />
        </Field>
        <Field label="Latest date">
          <Input type="date" name="windowEnd" defaultValue={defaults.windowEnd} />
        </Field>
      </div>

      <Button type="submit" className="self-start">
        <Compass className="size-4" aria-hidden />
        Explore deals
      </Button>
    </form>
  );
}

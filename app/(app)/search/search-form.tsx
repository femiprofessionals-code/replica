"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button, Field, Select, Input } from "@/components/ui";
import { AIRPORT_OPTIONS, CABIN_OPTIONS } from "@/lib/options";

type Defaults = {
  origin?: string;
  destination?: string;
  cabin?: string;
  date?: string;
  rangeStart?: string;
  rangeEnd?: string;
  pax?: string;
};

// GET form: submitting navigates to /search?... and the server component reads
// the params and calls the provider. The only client concern is the date mode.
export function SearchForm({ defaults }: { defaults: Defaults }) {
  const [mode, setMode] = useState<"date" | "range">(defaults.rangeStart ? "range" : "date");

  return (
    <form
      method="get"
      action="/search"
      className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-3"
    >
      <Field label="From" htmlFor="origin">
        <Select id="origin" name="origin" defaultValue={defaults.origin ?? ""} required>
          <option value="" disabled>
            Select origin
          </option>
          {AIRPORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="To" htmlFor="destination">
        <Select id="destination" name="destination" defaultValue={defaults.destination ?? ""} required>
          <option value="" disabled>
            Select destination
          </option>
          {AIRPORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Cabin" htmlFor="cabin">
        <Select id="cabin" name="cabin" defaultValue={defaults.cabin ?? "economy"}>
          {CABIN_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="sm:col-span-2 lg:col-span-2">
        <div className="mb-1.5 flex items-center gap-3">
          <span className="text-sm font-medium text-muted">When</span>
          <div className="flex gap-1 rounded-md border border-border p-0.5">
            <ModeButton active={mode === "date"} onClick={() => setMode("date")}>
              Exact date
            </ModeButton>
            <ModeButton active={mode === "range"} onClick={() => setMode("range")}>
              Date range
            </ModeButton>
          </div>
        </div>
        {mode === "date" ? (
          <Input type="date" name="date" defaultValue={defaults.date} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" name="rangeStart" defaultValue={defaults.rangeStart} aria-label="Earliest date" />
            <Input type="date" name="rangeEnd" defaultValue={defaults.rangeEnd} aria-label="Latest date" />
          </div>
        )}
      </div>

      <Field label="Passengers" htmlFor="pax">
        <Input id="pax" type="number" name="pax" min={1} max={9} defaultValue={defaults.pax ?? "1"} />
      </Field>

      <div className="flex items-end sm:col-span-2 lg:col-span-3">
        <Button type="submit" className="w-full sm:w-auto">
          <Search className="size-4" aria-hidden />
          Search awards
        </Button>
      </div>
    </form>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
        active ? "bg-secondary text-white" : "text-muted hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

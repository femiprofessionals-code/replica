"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { Button, Field, Select } from "@/components/ui";
import { MultiCheck } from "@/components/multi-check";
import { AIRPORT_OPTIONS, CABIN_OPTIONS, POINTS_PROGRAM_OPTIONS } from "@/lib/options";
import { updateAccount, type AccountState } from "./actions";

export function AccountForm({
  defaults,
}: {
  defaults: { home_airports: string[]; points_programs: string[]; cabin_pref: string };
}) {
  const [state, action, pending] = useActionState<AccountState, FormData>(updateAccount, {});

  return (
    <form action={action} className="flex flex-col gap-8">
      <Field label="Home airports">
        <MultiCheck
          name="home_airports"
          options={AIRPORT_OPTIONS}
          defaultSelected={defaults.home_airports}
        />
      </Field>

      <Field label="Points programs you collect">
        <MultiCheck
          name="points_programs"
          options={POINTS_PROGRAM_OPTIONS}
          defaultSelected={defaults.points_programs}
        />
      </Field>

      <Field label="Preferred cabin" htmlFor="cabin_pref">
        <Select id="cabin_pref" name="cabin_pref" defaultValue={defaults.cabin_pref}>
          {CABIN_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
        {state.saved ? (
          <span className="flex items-center gap-1 text-sm font-medium text-positive">
            <Check className="size-4" aria-hidden /> Saved
          </span>
        ) : null}
        {state.error ? <span className="text-sm text-warning">{state.error}</span> : null}
      </div>
    </form>
  );
}

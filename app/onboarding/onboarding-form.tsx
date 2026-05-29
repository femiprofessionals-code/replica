"use client";

import { useActionState } from "react";
import { Button, Field, Select } from "@/components/ui";
import { MultiCheck } from "@/components/multi-check";
import { AIRPORT_OPTIONS, CABIN_OPTIONS, POINTS_PROGRAM_OPTIONS } from "@/lib/options";
import { saveOnboarding, type OnboardingState } from "./actions";

export function OnboardingForm({
  defaults,
}: {
  defaults: { home_airports: string[]; points_programs: string[]; cabin_pref: string };
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(saveOnboarding, {});

  return (
    <form action={action} className="flex flex-col gap-8">
      <Field
        label="Home airports"
        hint="Where you usually start a trip. We use these to find deals that matter to you."
      >
        <MultiCheck
          name="home_airports"
          options={AIRPORT_OPTIONS}
          defaultSelected={defaults.home_airports}
        />
      </Field>

      <Field
        label="Points programs you collect"
        hint="The bank or card points you earn. We map these to airlines you can actually book."
      >
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

      {state.error ? <p className="text-sm text-warning">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Finish setup"}
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

// A chip-style multi-select backed by real checkbox inputs so it submits with
// a plain <form action={serverAction}>. Selection styling is client-side; the
// values still post as formData.getAll(name).
export function MultiCheck({
  name,
  options,
  defaultSelected = [],
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultSelected?: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected));

  function toggle(value: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isOn = selected.has(opt.value);
        return (
          <label
            key={opt.value}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              isOn
                ? "border-secondary bg-secondary/10 text-secondary"
                : "border-border bg-surface text-muted hover:border-secondary/40",
            )}
          >
            <input
              type="checkbox"
              name={name}
              value={opt.value}
              checked={isOn}
              onChange={() => toggle(opt.value)}
              className="sr-only"
            />
            <span
              className={cn(
                "grid size-4 place-items-center rounded border",
                isOn ? "border-secondary bg-secondary text-white" : "border-border",
              )}
            >
              {isOn ? <Check className="size-3" aria-hidden /> : null}
            </span>
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

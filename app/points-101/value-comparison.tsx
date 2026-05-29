"use client";

import { useState } from "react";
import { Coins, Plane, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";

// The hero interaction: pick a points balance and see the value gap between
// cashing out, using a card portal, and transferring to an airline. These cpp
// figures are educational reference rates, not award pricing.
const METHODS = [
  {
    key: "cashback",
    name: "Cash back",
    cpp: 1.0,
    icon: Wallet,
    blurb: "The floor. Most cards redeem points for one cent each.",
    tone: "neutral" as const,
  },
  {
    key: "portal",
    name: "Card travel portal",
    cpp: 1.35,
    icon: Coins,
    blurb: "A little better. You buy a normal ticket at a fixed points rate.",
    tone: "navy" as const,
  },
  {
    key: "transfer",
    name: "Transfer to an airline",
    cpp: 3.2,
    icon: Plane,
    blurb: "Where points shine. Move them to an airline and book award seats.",
    tone: "gold" as const,
  },
];

const BALANCES = [30_000, 60_000, 100_000, 150_000];

function usd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function ValueComparison() {
  const [points, setPoints] = useState(100_000);
  const maxValue = Math.max(...METHODS.map((m) => (points * m.cpp) / 100));

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-secondary">
            The value gap
          </p>
          <h2 className="text-2xl font-bold text-primary">What is a point really worth?</h2>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Points balance">
          {BALANCES.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setPoints(b)}
              aria-pressed={points === b}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors cursor-pointer tnum",
                points === b
                  ? "border-secondary bg-secondary text-white"
                  : "border-border bg-surface text-muted hover:border-secondary/40",
              )}
            >
              {b.toLocaleString("en-US")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-5">
        {METHODS.map((m) => {
          const value = (points * m.cpp) / 100;
          const width = Math.round((value / maxValue) * 100);
          const barColor =
            m.tone === "gold"
              ? "bg-cta"
              : m.tone === "navy"
                ? "bg-secondary"
                : "bg-slate-400";
          return (
            <div key={m.key}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-semibold text-primary">
                  <m.icon className="size-4 text-secondary" aria-hidden />
                  {m.name}
                </span>
                <span className="tnum text-lg font-bold text-primary">{usd(value)}</span>
              </div>
              <div className="h-9 w-full overflow-hidden rounded-lg bg-background">
                <div
                  className={cn("flex h-full items-center justify-end rounded-lg px-3 transition-all duration-500", barColor)}
                  style={{ width: `${Math.max(width, 8)}%` }}
                >
                  <span className="tnum text-xs font-semibold text-white">{m.cpp.toFixed(2)}¢/pt</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted">{m.blurb}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-6 rounded-lg bg-cta-soft/60 px-4 py-3 text-sm text-primary">
        Same {points.toLocaleString("en-US")} points. Transferring to an airline is worth{" "}
        <span className="tnum font-bold">
          {usd((points * METHODS[2].cpp) / 100 - (points * METHODS[0].cpp) / 100)}
        </span>{" "}
        more than cashing out. That gap is the whole game, and it is what ClearPoints helps you
        capture.
      </p>
    </div>
  );
}

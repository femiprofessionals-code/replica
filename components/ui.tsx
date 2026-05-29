import * as React from "react";
import { cn } from "@/lib/cn";

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
type ButtonVariant = "primary" | "secondary" | "ghost";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-cta text-white hover:brightness-95 hover:-translate-y-px shadow-sm focus-visible:outline-secondary",
  secondary:
    "bg-transparent text-primary border border-primary hover:bg-background",
  ghost: "bg-transparent text-secondary hover:underline",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------
const fieldBase =
  "w-full rounded-lg border border-border bg-surface px-4 py-3 text-base text-text transition-colors focus:border-secondary focus:outline-none focus:ring-3 focus:ring-secondary/20";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(fieldBase, className)} {...props} />;
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(fieldBase, "cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
});

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-muted", className)}
      {...props}
    />
  );
}

export function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-6 shadow-sm",
        interactive && "transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Badge / Chip
// ---------------------------------------------------------------------------
type BadgeTone = "neutral" | "positive" | "warning" | "gold" | "navy";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  positive: "bg-emerald-50 text-positive",
  warning: "bg-amber-50 text-warning",
  gold: "bg-cta-soft text-warning",
  navy: "bg-primary text-white",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Chip({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted",
        className,
      )}
      {...props}
    />
  );
}

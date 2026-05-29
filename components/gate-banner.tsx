import { Lock } from "lucide-react";

// Server-rendered upsell shown when the free tier limits results. The gate
// itself is enforced server-side; this only explains it.
export function GateBanner({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-cta/30 bg-cta-soft/60 p-4">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-cta text-white">
        <Lock className="size-4" aria-hidden />
      </span>
      <div>
        <p className="font-semibold text-primary">{title}</p>
        <p className="text-sm text-muted">{detail}</p>
        <p className="mt-1 text-sm font-medium text-warning">
          Premium unlocks business and first class plus the full 365 day window. Billing arrives
          in a later phase.
        </p>
      </div>
    </div>
  );
}

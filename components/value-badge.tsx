import { Badge } from "@/components/ui";
import { valueTier, VALUE_TIER_LABEL, formatCpp } from "@/lib/money";

// Shows the cents-per-point value with a tone that reflects how good it is.
export function ValueBadge({ cpp }: { cpp: number }) {
  const tier = valueTier(cpp);
  const tone = tier === "great" ? "positive" : tier === "fair" ? "neutral" : "warning";
  return (
    <Badge tone={tone}>
      <span className="tnum">{formatCpp(cpp)}</span>
      <span className="opacity-70">· {VALUE_TIER_LABEL[tier]}</span>
    </Badge>
  );
}

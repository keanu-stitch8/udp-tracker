import { cn } from "@/lib/utils";

/** Batang pagu: hijau < 80%, kuning 80–100%, merah > 100% (spec §5). */
export function BudgetBar({ used, limit, className }: { used: number; limit: number; className?: string }) {
  const ratio = limit > 0 ? used / limit : used > 0 ? 2 : 0;
  const tone = ratio > 1 ? "bg-destructive" : ratio >= 0.8 ? "bg-primary" : "bg-green-500";
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={used}
      className={cn("h-4 w-full overflow-hidden border-2 bg-background", className)}
    >
      <div className={cn("h-full transition-all", tone)} style={{ width: `${Math.min(ratio, 1) * 100}%` }} />
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <div
        className={cn(
          "mb-4 flex size-9 items-center justify-center rounded-xl border",
          accent ? "border-primary/20 bg-primary/10" : "border-white/10 bg-white/[0.03]"
        )}
      >
        <Icon className={cn("size-[18px]", accent ? "text-primary" : "text-muted-foreground")} strokeWidth={1.75} />
      </div>
      <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

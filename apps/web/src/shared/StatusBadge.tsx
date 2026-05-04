import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StatusBadge({ enabled }: { enabled: number | boolean }) {
  const isEnabled = Boolean(enabled);
  return (
    <Badge
      className={cn(
        "border",
        isEnabled
          ? "border-chart-3/30 bg-chart-3/10 text-chart-3"
          : "border-destructive/30 bg-destructive/10 text-destructive"
      )}
      variant="outline"
    >
      {isEnabled ? "启用" : "停用"}
    </Badge>
  );
}

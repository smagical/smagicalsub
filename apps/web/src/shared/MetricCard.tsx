import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "green" | "blue" | "amber" | "rose";
};

const metricToneClasses: Record<MetricCardProps["tone"], string> = {
  green: "bg-primary text-primary-foreground",
  blue: "bg-secondary text-secondary-foreground",
  amber: "bg-accent text-accent-foreground",
  rose: "bg-destructive/10 text-destructive"
};

export function MetricCard({ label, value, icon: Icon, tone }: MetricCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex min-h-[88px] items-center gap-3.5">
        <div className={cn("grid size-10 place-items-center rounded-md", metricToneClasses[tone])}>
          <Icon />
        </div>
        <div className="min-w-0">
          <span className="block text-sm text-muted-foreground">{label}</span>
          <strong className="mt-1 block text-3xl leading-none">{value}</strong>
        </div>
      </CardContent>
    </Card>
  );
}

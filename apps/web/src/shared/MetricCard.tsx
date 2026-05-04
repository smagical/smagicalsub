import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "green" | "blue" | "amber" | "rose";
};

// 使用 chart token 定义指标色调，主题切换时会自动继承明暗色板。
const metricToneClasses: Record<MetricCardProps["tone"], { card: string; icon: string; marker: string; value: string }> = {
  green: {
    card: "border-t-[4px] border-t-chart-3 bg-card",
    icon: "bg-chart-2/15 text-chart-2 ring-1 ring-chart-2/20",
    marker: "bg-chart-3",
    value: "text-chart-3"
  },
  blue: {
    card: "border-t-[4px] border-t-primary bg-card",
    icon: "bg-chart-1/15 text-chart-1 ring-1 ring-chart-1/20",
    marker: "bg-chart-1",
    value: "text-chart-1"
  },
  amber: {
    card: "border-t-[4px] border-t-chart-4 bg-card",
    icon: "bg-chart-4/15 text-chart-4 ring-1 ring-chart-4/20",
    marker: "bg-chart-4",
    value: "text-chart-4"
  },
  rose: {
    card: "border-t-[4px] border-t-destructive bg-card",
    icon: "bg-destructive/15 text-destructive ring-1 ring-destructive/20",
    marker: "bg-destructive",
    value: "text-destructive"
  }
};

export function MetricCard({ label, value, icon: Icon, tone }: MetricCardProps) {
  const toneClass = metricToneClasses[tone];

  return (
    <Card className={toneClass.card} size="sm">
      <CardContent className="flex min-h-[88px] items-center gap-3.5">
        <div className={cn("grid size-10 place-items-center rounded-md", toneClass.icon)}>
          <Icon />
        </div>
        <div className="min-w-0">
          <span className="block text-sm text-muted-foreground">{label}</span>
          <strong className={cn("mt-1 block text-3xl leading-none", toneClass.value)}>{value}</strong>
          <span className={cn("mt-3 block h-1.5 w-12 rounded-full", toneClass.marker)} />
        </div>
      </CardContent>
    </Card>
  );
}

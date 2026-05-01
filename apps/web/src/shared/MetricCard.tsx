import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "green" | "blue" | "amber" | "rose";
};

export function MetricCard({ label, value, icon: Icon, tone }: MetricCardProps) {
  return (
    <Card className={`metric-card ${tone}`} size="sm">
      <CardContent className="metric-card-content">
        <div className="metric-icon">
          <Icon />
        </div>
        <div>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      </CardContent>
    </Card>
  );
}

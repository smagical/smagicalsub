import type { DashboardDto } from "@smagicalsub/shared";
import { Cable, FileSliders, KeyRound, Server } from "lucide-react";
import { MetricCard } from "../../shared/MetricCard";

type DashboardMetricsProps = {
  totals: DashboardDto["totals"];
};

export function DashboardMetrics({ totals }: DashboardMetricsProps) {
  return (
    <section className="metric-grid" aria-label="关键指标">
      <MetricCard label="订阅源" value={totals.sources} icon={Cable} tone="green" />
      <MetricCard label="节点" value={totals.nodes} icon={Server} tone="blue" />
      <MetricCard label="配置档" value={totals.profiles} icon={FileSliders} tone="amber" />
      <MetricCard label="令牌" value={totals.tokens} icon={KeyRound} tone="rose" />
    </section>
  );
}

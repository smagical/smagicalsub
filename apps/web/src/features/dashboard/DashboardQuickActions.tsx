import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardDto } from "@smagicalsub/shared";
import { Activity, Cable, FileSliders, RefreshCw } from "lucide-react";
import type { SectionId } from "../../app/navigation";
import { Eyebrow } from "../../shared/Eyebrow";
import { PageFeedback } from "../../shared/PageFeedback";

const quickActions = [
  { label: "添加订阅源", icon: Cable, target: "sources", tone: "source" },
  { label: "刷新节点", icon: RefreshCw, action: "refresh-sources", tone: "sync" },
  { label: "生成配置", icon: FileSliders, target: "profiles", tone: "profile" }
] satisfies Array<{
  action?: "refresh-sources";
  label: string;
  icon: typeof Cable;
  tone: "profile" | "source" | "sync";
  target?: SectionId;
}>;

const actionToneClasses: Record<(typeof quickActions)[number]["tone"], string> = {
  profile: "border-chart-3/30 bg-chart-3/10 text-chart-3 hover:bg-chart-3/15",
  source: "border-chart-2/30 bg-chart-2/10 text-chart-2 hover:bg-chart-2/15",
  sync: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
};

type DashboardQuickActionsProps = {
  error: unknown;
  notice: string | null;
  pending: boolean;
  requestStats?: DashboardDto["requestStats"];
  totals: DashboardDto["totals"];
  onNavigate: (section: SectionId) => void;
  onRefresh: () => void;
};

export function DashboardQuickActions({ error, notice, pending, requestStats, totals, onNavigate, onRefresh }: DashboardQuickActionsProps) {
  const stats = requestStats ?? emptyRequestStats;
  const successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <Eyebrow>Workflow</Eyebrow>
          <CardTitle>工作流和请求统计</CardTitle>
        </div>
        <Badge className="border-primary/30 bg-primary/10 text-primary" variant="outline">
          <Activity />
          {successRate}% 成功
        </Badge>
      </CardHeader>
      <CardContent className="grid flex-1 gap-4">
        <div className="grid grid-cols-3 gap-2.5 max-[920px]:grid-cols-1">
          {quickActions.map((action) => (
            <Button
              className={cn("justify-start", actionToneClasses[action.tone])}
              disabled={pending}
              key={action.label}
              onClick={() => runQuickAction(action, onNavigate, onRefresh)}
              type="button"
              variant="outline"
            >
              <action.icon data-icon="inline-start" />
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_180px] gap-3.5 max-[720px]:grid-cols-1">
          <RequestTrendChart trend={stats.trend} />
          <RequestSummary stats={stats} />
        </div>
        <RequestDistribution stats={stats} />
        <PageFeedback error={error} notice={notice} />
      </CardContent>
    </Card>
  );
}

function runQuickAction(action: (typeof quickActions)[number], onNavigate: (section: SectionId) => void, onRefresh: () => void) {
  if (action.action === "refresh-sources") {
    onRefresh();
    return;
  }

  if (action.target) {
    onNavigate(action.target);
  }
}

function RequestTrendChart({ trend }: { trend: NonNullable<DashboardDto["requestStats"]>["trend"] }) {
  const maxValue = Math.max(1, ...trend.map((item) => item.value));

  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">请求趋势</span>
        <span className="font-mono text-xs text-muted-foreground">最近 7 段</span>
      </div>
      <div className="flex h-32 items-end gap-2" aria-label="请求趋势图表">
        {trend.map((item, index) => (
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={`${item.label}-${index}`}>
            <div className="flex h-24 w-full items-end rounded-md bg-background/70 px-1.5 py-1.5">
              <span
                className={cn("block w-full rounded-sm", trendBarClass(index))}
                style={{ height: item.value > 0 ? `${Math.max(8, Math.round((item.value / maxValue) * 100))}%` : "0%" }}
                title={`${item.label}: ${item.value}`}
              />
            </div>
            <span className="max-w-full truncate font-mono text-[11px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RequestSummary({ stats }: { stats: NonNullable<DashboardDto["requestStats"]> }) {
  return (
    <div className="grid gap-2">
      <SummaryItem label="总请求" value={stats.total} tone="primary" />
      <SummaryItem label="成功" value={stats.success} tone="success" />
      <SummaryItem label="缓存命中" value={stats.cached} tone="cache" />
      <SummaryItem label="拦截" value={stats.blocked} tone="warning" />
    </div>
  );
}

function SummaryItem({ label, value, tone }: { label: string; value: number; tone: "cache" | "primary" | "success" | "warning" }) {
  return (
    <div className={cn("flex items-center justify-between rounded-lg border px-3 py-2", summaryToneClass(tone))}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <strong className="font-mono text-lg leading-none">{value}</strong>
    </div>
  );
}

function RequestDistribution({ stats }: { stats: NonNullable<DashboardDto["requestStats"]> }) {
  const segments = [
    { label: "成功", value: stats.success, className: "bg-chart-3" },
    { label: "缓存", value: stats.cached, className: "bg-primary" },
    { label: "拦截", value: stats.blocked, className: "bg-chart-4" }
  ];
  const total = Math.max(1, segments.reduce((sum, item) => sum + item.value, 0));

  return (
    <div className="grid gap-2 rounded-lg border bg-muted/20 p-3">
      <div className="flex h-2 overflow-hidden rounded-full bg-background">
        {segments.map((segment) => (
          <span className={segment.className} key={segment.label} style={{ width: segment.value > 0 ? `${Math.max(4, (segment.value / total) * 100)}%` : "0%" }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {segments.map((segment) => (
          <Badge key={segment.label} variant="outline">
            {segment.label} {segment.value}
          </Badge>
        ))}
      </div>
    </div>
  );
}

const emptyRequestStats: NonNullable<DashboardDto["requestStats"]> = {
  blocked: 0,
  cached: 0,
  success: 0,
  total: 0,
  trend: []
};

function trendBarClass(index: number) {
  return ["bg-chart-3", "bg-primary", "bg-chart-2", "bg-chart-4"][index % 4];
}

function summaryToneClass(tone: "cache" | "primary" | "success" | "warning") {
  const classes = {
    cache: "border-primary/20 bg-primary/10",
    primary: "border-chart-2/20 bg-chart-2/10",
    success: "border-chart-3/20 bg-chart-3/10",
    warning: "border-chart-4/20 bg-chart-4/10"
  };

  return classes[tone];
}

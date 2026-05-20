import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardDto, HealthDto } from "@smagicalsub/shared";
import { Database } from "lucide-react";
import { Eyebrow } from "../../shared/Eyebrow";

type DashboardStorageCardProps = {
  health?: HealthDto;
  requestStats?: DashboardDto["requestStats"];
  totals: DashboardDto["totals"];
};

export function DashboardStorageCard({ health, requestStats, totals }: DashboardStorageCardProps) {
  const d1Records = totals.sources + totals.nodes + totals.profiles + totals.tokens;
  const cacheHits = requestStats?.cached ?? 0;
  const requestTotal = requestStats?.total ?? 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <Eyebrow>Storage</Eyebrow>
          <CardTitle>D1 / KV 状态</CardTitle>
        </div>
        <CardAction>
          <Database />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="grid gap-2.5">
          <StorageItem label="D1" meta={`${d1Records} 条记录`} value="业务主库、订阅源、节点、令牌" tone="db" />
          <StorageItem label="KV" meta={`${cacheHits} 次命中`} value="订阅配置缓存、上游原文缓存、限流计数" tone="cache" />
          <StorageItem label="Worker" meta={health?.env ?? "local"} value="前端资源和 API 同域运行" tone="runtime" />
        </div>
        <div className="grid flex-1 grid-rows-[auto_1fr] gap-2 rounded-lg border bg-muted/25 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">请求链路</span>
            <Badge className="border-chart-3/30 bg-chart-3/10 text-chart-3" variant="outline">
              {health?.status ?? "waiting"}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 max-[560px]:grid-cols-1">
            <PipelineStep label="Client" value={`${requestTotal} 请求`} />
            <PipelineStep label="Worker" value={health?.authRequired ? "鉴权开启" : "公开模式"} />
            <PipelineStep label="D1 + KV" value="读写分层" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">D1 主库</Badge>
          <Badge variant="outline">KV 缓存</Badge>
          <Badge variant="secondary">Assets + API</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

const storageToneClasses = {
  cache: { dot: "bg-chart-3", row: "border-l-chart-3 bg-chart-3/10", title: "text-chart-3" },
  db: { dot: "bg-primary", row: "border-l-primary bg-primary/10", title: "text-primary" },
  runtime: { dot: "bg-chart-2", row: "border-l-chart-2 bg-chart-2/10", title: "text-chart-2" }
};

function StorageItem({ label, meta, tone, value }: { label: string; meta: string; tone: keyof typeof storageToneClasses; value: string }) {
  const toneClass = storageToneClasses[tone];

  return (
    <div className={cn("grid min-h-[58px] grid-cols-[120px_minmax(0,1fr)] items-center gap-3 rounded-lg border px-3 py-2 max-[560px]:grid-cols-1", toneClass.row)}>
      <div className="min-w-0">
        <strong className={cn("inline-flex items-center gap-2", toneClass.title)}>
          <span className={cn("size-2 rounded-full", toneClass.dot)} />
          {label}
        </strong>
        <span className="mt-1 block font-mono text-[11px] text-muted-foreground">{meta}</span>
      </div>
      <span className="min-w-0 text-sm text-muted-foreground">{value}</span>
    </div>
  );
}

function PipelineStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-h-[72px] content-center gap-1 rounded-md border bg-background/70 px-3 py-2">
      <span className="font-mono text-[11px] text-muted-foreground">{label}</span>
      <strong className="truncate text-sm">{value}</strong>
    </div>
  );
}

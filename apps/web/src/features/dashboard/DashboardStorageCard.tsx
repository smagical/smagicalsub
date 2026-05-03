import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { HealthDto } from "@smagicalsub/shared";
import { Database } from "lucide-react";
import { Eyebrow } from "../../shared/Eyebrow";

type DashboardStorageCardProps = {
  health?: HealthDto;
};

export function DashboardStorageCard({ health }: DashboardStorageCardProps) {
  return (
    <Card className="bg-gradient-to-br from-card via-card to-chart-2/10 shadow-md shadow-primary/5">
      <CardHeader>
        <div>
          <Eyebrow>Storage</Eyebrow>
          <CardTitle>D1 / KV 状态</CardTitle>
        </div>
        <CardAction>
          <Database />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2.5">
          <StorageItem label="D1" value="业务主库、订阅源、节点、令牌" tone="db" />
          <StorageItem label="KV" value="订阅配置缓存、上游原文缓存、限流计数" tone="cache" />
          <StorageItem label="Worker" value={health?.env ?? "local"} tone="runtime" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{health?.status ?? "waiting"}</Badge>
          <Badge variant="secondary">Assets + API</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

const storageToneClasses = {
  cache: { dot: "bg-chart-3", row: "border-l-chart-3 bg-chart-3/10", title: "text-chart-3" },
  db: { dot: "bg-chart-1", row: "border-l-chart-1 bg-chart-1/10", title: "text-chart-1" },
  runtime: { dot: "bg-chart-2", row: "border-l-chart-2 bg-chart-2/10", title: "text-chart-2" }
};

function StorageItem({ label, tone, value }: { label: string; tone: keyof typeof storageToneClasses; value: string }) {
  const toneClass = storageToneClasses[tone];

  return (
    <div className={cn("flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 py-2 shadow-sm max-[560px]:items-start max-[560px]:flex-col", toneClass.row)}>
      <strong className={cn("inline-flex items-center gap-2", toneClass.title)}>
        <span className={cn("size-2 rounded-full", toneClass.dot)} />
        {label}
      </strong>
      <span className="text-right text-sm text-muted-foreground max-[560px]:text-left">{value}</span>
    </div>
  );
}

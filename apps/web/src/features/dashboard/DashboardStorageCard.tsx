import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HealthDto } from "@smagicalsub/shared";
import { Database } from "lucide-react";
import { Eyebrow } from "../../shared/Eyebrow";

type DashboardStorageCardProps = {
  health?: HealthDto;
};

export function DashboardStorageCard({ health }: DashboardStorageCardProps) {
  return (
    <Card>
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
          <StorageItem label="D1" value="业务主库、订阅源、节点、令牌" />
          <StorageItem label="KV" value="订阅配置缓存、上游原文缓存、限流计数" />
          <StorageItem label="Worker" value={health?.env ?? "local"} />
        </div>
      </CardContent>
    </Card>
  );
}

function StorageItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2 max-[560px]:items-start max-[560px]:flex-col">
      <strong>{label}</strong>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  );
}

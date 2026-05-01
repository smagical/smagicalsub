import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HealthDto } from "@smagicalsub/shared";
import { Database } from "lucide-react";

type DashboardStorageCardProps = {
  health?: HealthDto;
};

export function DashboardStorageCard({ health }: DashboardStorageCardProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <p className="eyebrow">Storage</p>
          <CardTitle>D1 / KV 状态</CardTitle>
        </div>
        <CardAction>
          <Database />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="storage-list">
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
    <div className="storage-item">
      <strong>{label}</strong>
      <span>{value}</span>
    </div>
  );
}

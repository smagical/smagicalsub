import { Badge } from "@/components/ui/badge";
import type { SubscriptionHealthResult } from "./subscriptionHealth";

type SubscriptionHealthStatusProps = {
  pending: boolean;
  result: SubscriptionHealthResult;
};

export function SubscriptionHealthStatus({ pending, result }: SubscriptionHealthStatusProps) {
  if (pending) {
    return <Badge variant="outline">检查中</Badge>;
  }

  if (!result) {
    return <p className="text-xs text-muted-foreground">点击健康检查，确认当前订阅地址和格式是否可用。</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={result.ok ? "secondary" : "destructive"}>{result.statusText}</Badge>
      <span className="text-xs text-muted-foreground">{result.detail}</span>
    </div>
  );
}

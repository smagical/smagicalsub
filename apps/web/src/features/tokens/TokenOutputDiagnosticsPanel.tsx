import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle } from "lucide-react";
import type { TokenOutputDiagnostics } from "./useTokenOutputDiagnostics";

type TokenOutputDiagnosticsPanelProps = {
  diagnostics: TokenOutputDiagnostics;
};

export function TokenOutputDiagnosticsPanel({ diagnostics }: TokenOutputDiagnosticsPanelProps) {
  return (
    <div className="mt-3 grid gap-2 rounded-xl border bg-background/75 p-2.5">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="启用节点数" value={diagnostics.enabledNodeCount} />
        <Metric label="节点分组数" value={diagnostics.groupCount} />
        <Metric label="启用规则数" value={diagnostics.enabledRuleCount} />
        <Metric label="配置档" value={diagnostics.profileName} />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge className="gap-1.5" variant="outline">
          <Activity />
          手动 {diagnostics.manualNodeCount} / 订阅源 {diagnostics.sourceNodeCount}
        </Badge>
        <Badge variant={diagnostics.profileAvailable ? "secondary" : "destructive"}>{diagnostics.profileAvailable ? "配置档可用" : "配置档不可用"}</Badge>
        <Badge variant={diagnostics.warnings.length === 0 ? "secondary" : "outline"}>
          {diagnostics.warnings.length === 0 ? "输出状态正常" : `${diagnostics.warnings.length} 个提示`}
        </Badge>
      </div>
      {diagnostics.warnings.length > 0 ? (
        <p className="flex items-start gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 text-destructive" />
          {diagnostics.warnings.join("；")}
        </p>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border bg-card/80 px-2.5 py-1.5 text-sm">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <strong className="min-w-0 truncate text-right font-medium">{value}</strong>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import type { TokenOutputDiagnostics } from "./useTokenOutputDiagnostics";

type TokenOutputDiagnosticsPanelProps = {
  diagnostics: TokenOutputDiagnostics;
};

export function TokenOutputDiagnosticsPanel({ diagnostics }: TokenOutputDiagnosticsPanelProps) {
  return (
    <div className="mt-3 grid gap-3 rounded-md border bg-background/60 p-3 md:grid-cols-[1fr_1fr]">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Metric label="启用节点" value={diagnostics.enabledNodeCount} />
        <Metric label="节点分组" value={diagnostics.groupCount} />
        <Metric label="启用规则" value={diagnostics.enabledRuleCount} />
        <Metric label="配置档" value={diagnostics.profileName} />
      </div>
      <div className="flex flex-col justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          手动节点 {diagnostics.manualNodeCount} 个，订阅源节点 {diagnostics.sourceNodeCount} 个。
        </span>
        <div className="flex flex-wrap gap-2">
          <Badge variant={diagnostics.profileAvailable ? "secondary" : "destructive"}>{diagnostics.profileAvailable ? "配置档可用" : "配置档不可用"}</Badge>
          <Badge variant={diagnostics.warnings.length === 0 ? "secondary" : "outline"}>
            {diagnostics.warnings.length === 0 ? "输出状态正常" : `${diagnostics.warnings.length} 个提示`}
          </Badge>
        </div>
        {diagnostics.warnings.length > 0 ? <p className="text-xs text-muted-foreground">{diagnostics.warnings.join("；")}</p> : null}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border bg-card/70 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="truncate font-medium">{value}</div>
    </div>
  );
}

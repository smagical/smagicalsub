import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterBar } from "../../shared/FilterBar";

type SourceFiltersProps = {
  exportDisabled: boolean;
  pending: boolean;
  searchQuery: string;
  sourceCount: number;
  statusFilter: string;
  onExport: () => void;
  onRefreshAll: () => void;
  onSearchQueryChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
};

export function SourceFilters({
  exportDisabled,
  pending,
  searchQuery,
  sourceCount,
  statusFilter,
  onExport,
  onRefreshAll,
  onSearchQueryChange,
  onStatusFilterChange
}: SourceFiltersProps) {
  return (
    <FilterBar align="start" className="mb-0 rounded-xl border bg-card/75 p-3 shadow-sm ring-1 ring-primary/10">
      <label className="grid min-w-[260px] flex-1 gap-1.5 max-[720px]:min-w-full">
        <span className="text-xs font-semibold text-muted-foreground">搜索订阅源</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 pr-20"
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="名称 / 链接 / 错误"
            type="search"
            value={searchQuery}
          />
          <Badge className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" variant="outline">
            {sourceCount} 个
          </Badge>
        </div>
      </label>

      <div className="grid gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">状态筛选</span>
        <div className="flex flex-wrap gap-1 rounded-lg border bg-background/65 p-1" role="radiogroup" aria-label="状态筛选">
          {sourceStatusOptions.map((option) => (
            <button
              aria-checked={statusFilter === option.value}
              className={cn(
                "h-7 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors",
                "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                statusFilter === option.value && "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/25"
              )}
              key={option.value}
              onClick={() => onStatusFilterChange(option.value)}
              role="radio"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <Button className="self-end" disabled={pending || sourceCount === 0} onClick={onRefreshAll} type="button" variant="info">
        <RefreshCw data-icon="inline-start" />
        刷新全部启用
      </Button>
      <Button className="self-end" disabled={exportDisabled} onClick={onExport} type="button" variant="outline">
        <Download data-icon="inline-start" />
        导出 CSV
      </Button>
    </FilterBar>
  );
}

const sourceStatusOptions = [
  { label: "全部", value: "all" },
  { label: "启用", value: "enabled" },
  { label: "停用", value: "disabled" },
  { label: "成功", value: "success" },
  { label: "失败", value: "failed" },
  { label: "未刷新", value: "never" }
] as const;

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Download, Search } from "lucide-react";
import { FilterBar } from "../../shared/FilterBar";
import { FilterField } from "../../shared/FilterField";

type ProfileFiltersProps = {
  exportDisabled: boolean;
  searchQuery: string;
  statusFilter: string;
  onExport: () => void;
  onSearchQueryChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
};

export function ProfileFilters({
  exportDisabled,
  searchQuery,
  statusFilter,
  onExport,
  onSearchQueryChange,
  onStatusFilterChange
}: ProfileFiltersProps) {
  return (
    <FilterBar align="start" className="mb-0 rounded-xl border bg-card/75 p-2.5 shadow-sm ring-1 ring-chart-3/10">
      <label className="grid min-w-[220px] flex-1 gap-1 max-[720px]:min-w-full">
        <span className="text-xs font-semibold text-muted-foreground">搜索配置档</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="名称 / 策略 / 描述"
            type="search"
            value={searchQuery}
          />
        </div>
      </label>
      <FilterField className="min-w-[140px] gap-1" label="状态筛选">
        <NativeSelect className="truncate" onChange={(event) => onStatusFilterChange(event.target.value)} value={statusFilter}>
          <option value="all">全部配置档</option>
          <option value="enabled">已启用</option>
          <option value="disabled">已停用</option>
        </NativeSelect>
      </FilterField>
      <Button className="self-end" disabled={exportDisabled} onClick={onExport} type="button" variant="info">
        <Download data-icon="inline-start" />
        导出 CSV
      </Button>
    </FilterBar>
  );
}

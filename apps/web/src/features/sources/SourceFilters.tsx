import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { FilterBar } from "../../shared/FilterBar";
import { FilterField } from "../../shared/FilterField";

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
    <FilterBar>
      <FilterField label="搜索订阅源">
        <Input
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="名称 / 链接 / 错误"
          type="search"
          value={searchQuery}
        />
      </FilterField>
      <FilterField label="状态筛选">
        <NativeSelect onChange={(event) => onStatusFilterChange(event.target.value)} value={statusFilter}>
          <option value="all">全部订阅源</option>
          <option value="enabled">已启用</option>
          <option value="disabled">已停用</option>
          <option value="success">刷新成功</option>
          <option value="failed">刷新失败</option>
          <option value="never">未刷新</option>
        </NativeSelect>
      </FilterField>
      <Button disabled={pending || sourceCount === 0} onClick={onRefreshAll} type="button" variant="outline">
        刷新全部启用
      </Button>
      <Button disabled={exportDisabled} onClick={onExport} type="button" variant="outline">
        导出 CSV
      </Button>
    </FilterBar>
  );
}

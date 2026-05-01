import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
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
    <FilterBar>
      <FilterField label="搜索配置档">
        <Input
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="名称 / 策略 / 描述"
          type="search"
          value={searchQuery}
        />
      </FilterField>
      <FilterField label="状态筛选">
        <NativeSelect onChange={(event) => onStatusFilterChange(event.target.value)} value={statusFilter}>
          <option value="all">全部配置档</option>
          <option value="enabled">已启用</option>
          <option value="disabled">已停用</option>
        </NativeSelect>
      </FilterField>
      <Button disabled={exportDisabled} onClick={onExport} type="button" variant="outline">
        导出 CSV
      </Button>
    </FilterBar>
  );
}

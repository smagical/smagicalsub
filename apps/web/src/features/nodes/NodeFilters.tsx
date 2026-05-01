import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { NodeBatchActionInput } from "@smagicalsub/shared";
import { ConfirmButton } from "../../shared/ConfirmButton";
import { FilterBar } from "../../shared/FilterBar";
import { FilterField } from "../../shared/FilterField";

type NodeFiltersProps = {
  exportDisabled?: boolean;
  groups: string[];
  groupFilter: string;
  searchQuery: string;
  onExport?: () => void;
  onGroupFilterChange: (group: string) => void;
  onSearchQueryChange: (query: string) => void;
};

export function NodeFilters({
  exportDisabled = false,
  groups,
  groupFilter,
  searchQuery,
  onExport,
  onGroupFilterChange,
  onSearchQueryChange
}: NodeFiltersProps) {
  return (
    <FilterBar>
      <FilterField label="搜索节点">
        <Input
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="名称 / 协议 / 服务端 / 分组"
          type="search"
          value={searchQuery}
        />
      </FilterField>
      <FilterField label="分组筛选">
        <NativeSelect onChange={(event) => onGroupFilterChange(event.target.value)} value={groupFilter}>
          <option value="all">全部节点</option>
          <option value="ungrouped">未分组</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </NativeSelect>
      </FilterField>
      {onExport ? (
        <Button disabled={exportDisabled} onClick={onExport} type="button" variant="outline">
          导出 CSV
        </Button>
      ) : null}
    </FilterBar>
  );
}

type NodeBatchBarProps = {
  batchGroups: string;
  pending: boolean;
  selectedCount: number;
  onAction: (action: NodeBatchActionInput["action"]) => void;
  onBatchGroupsChange: (groups: string) => void;
  onClearSelection: () => void;
};

export function NodeBatchBar({
  batchGroups,
  pending,
  selectedCount,
  onAction,
  onBatchGroupsChange,
  onClearSelection
}: NodeBatchBarProps) {
  const disabled = pending || selectedCount === 0;

  return (
    <FilterBar align="start">
      <Badge variant="secondary">已选择 {selectedCount} 个节点</Badge>
      <FilterField label="批量分组">
        <Input
          disabled={disabled}
          onChange={(event) => onBatchGroupsChange(event.target.value)}
          placeholder="香港,日本,备用"
          type="text"
          value={batchGroups}
        />
      </FilterField>
      <Button disabled={disabled} onClick={() => onAction("enable")} type="button" variant="outline">
        启用
      </Button>
      <Button disabled={disabled} onClick={() => onAction("disable")} type="button" variant="outline">
        停用
      </Button>
      <Button disabled={disabled} onClick={() => onAction("set-groups")} type="button" variant="outline">
        覆盖分组
      </Button>
      <Button disabled={disabled} onClick={() => onAction("append-groups")} type="button" variant="outline">
        追加分组
      </Button>
      <ConfirmButton
        disabled={disabled}
        description="删除后这些节点不会再出现在任何订阅输出中。"
        onConfirm={() => onAction("delete")}
        title={`删除选中的 ${selectedCount} 个节点？`}
        type="button"
      >
        删除
      </ConfirmButton>
      <Button disabled={disabled} onClick={onClearSelection} type="button" variant="ghost">
        清空选择
      </Button>
    </FilterBar>
  );
}

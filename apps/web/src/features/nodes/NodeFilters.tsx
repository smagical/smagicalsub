import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { NodeBatchActionInput } from "@smagicalsub/shared";
import { Download, Search, Trash2 } from "lucide-react";
import { ConfirmButton } from "../../shared/ConfirmButton";
import { FilterBar } from "../../shared/FilterBar";
import { FilterField } from "../../shared/FilterField";

type NodeFiltersProps = {
  exportDisabled?: boolean;
  groups: string[];
  groupFilter: string;
  nodeCount: number;
  protocolFilter: string;
  protocols: string[];
  searchQuery: string;
  totalCount: number;
  onExport?: () => void;
  onGroupFilterChange: (group: string) => void;
  onProtocolFilterChange: (protocol: string) => void;
  onSearchQueryChange: (query: string) => void;
};

export function NodeFilters({
  exportDisabled = false,
  groups,
  groupFilter,
  nodeCount,
  protocolFilter,
  protocols,
  searchQuery,
  totalCount,
  onExport,
  onGroupFilterChange,
  onProtocolFilterChange,
  onSearchQueryChange
}: NodeFiltersProps) {
  return (
    <FilterBar align="start" className="mb-0 rounded-xl border bg-card/75 p-3 shadow-sm ring-1 ring-primary/10">
      <label className="grid min-w-[280px] flex-1 gap-1.5 max-[720px]:min-w-full">
        <span className="text-xs font-semibold text-muted-foreground">搜索节点</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 pr-24"
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="名称 / 协议 / 服务端 / 分组"
            type="search"
            value={searchQuery}
          />
          <Badge className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" variant="outline">
            {nodeCount}/{totalCount}
          </Badge>
        </div>
      </label>
      <FilterField className="min-w-[180px]" label="分组筛选">
        <NativeSelect className="truncate" onChange={(event) => onGroupFilterChange(event.target.value)} value={groupFilter}>
          <option value="all">全部节点</option>
          <option value="default">默认</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </NativeSelect>
      </FilterField>
      <FilterField className="min-w-[160px]" label="协议筛选">
        <NativeSelect className="truncate" onChange={(event) => onProtocolFilterChange(event.target.value)} value={protocolFilter}>
          <option value="all">全部协议</option>
          {protocols.map((protocol) => (
            <option key={protocol} value={protocol}>
              {protocol}
            </option>
          ))}
        </NativeSelect>
      </FilterField>
      {onExport ? (
        <Button className="self-end" disabled={exportDisabled} onClick={onExport} type="button" variant="outline">
          <Download data-icon="inline-start" />
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
    <FilterBar align="start" className="mb-0 rounded-xl border bg-card/75 p-3 shadow-sm ring-1 ring-chart-4/10">
      <Badge className="h-8 border-chart-4/30 bg-chart-4/10 text-chart-4" variant="outline">
        已选择 {selectedCount} 个节点
      </Badge>
      <FilterField className="min-w-[260px] flex-1 max-[720px]:min-w-full" label="批量分组">
        <Input
          className="truncate"
          disabled={disabled}
          onChange={(event) => onBatchGroupsChange(event.target.value)}
          placeholder="香港,日本,备用"
          type="text"
          value={batchGroups}
        />
      </FilterField>
      <div className="grid grid-cols-4 gap-2 max-[760px]:grid-cols-2 max-[420px]:grid-cols-1">
        <Button disabled={disabled} onClick={() => onAction("enable")} type="button" variant="success">
          启用
        </Button>
        <Button disabled={disabled} onClick={() => onAction("disable")} type="button" variant="warning">
          停用
        </Button>
        <Button disabled={disabled} onClick={() => onAction("set-groups")} type="button" variant="info">
          覆盖分组
        </Button>
        <Button disabled={disabled} onClick={() => onAction("append-groups")} type="button" variant="info">
          追加分组
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 max-[420px]:grid-cols-1">
        <ConfirmButton
          disabled={disabled}
          description="删除后这些节点不会再出现在任何订阅输出中。"
          onConfirm={() => onAction("delete")}
          title={`删除选中的 ${selectedCount} 个节点？`}
          type="button"
        >
          <Trash2 data-icon="inline-start" />
          删除
        </ConfirmButton>
        <Button disabled={disabled} onClick={onClearSelection} type="button" variant="outline">
          清空选择
        </Button>
      </div>
    </FilterBar>
  );
}

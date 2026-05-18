import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { NodeBatchActionInput } from "@smagicalsub/shared";
import { Check, ChevronDown, Download, Search, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ConfirmButton } from "../../shared/ConfirmButton";
import { FilterBar } from "../../shared/FilterBar";
import { FilterField } from "../../shared/FilterField";
import { TagInput } from "../../shared/TagInput";
import { UNGROUPED_GROUP_LABEL } from "./utils";

type NodeFiltersProps = {
  exportDisabled?: boolean;
  groups: string[];
  groupFilters: string[];
  includeUngrouped: boolean;
  nodeCount: number;
  protocolFilter: string;
  protocols: string[];
  searchQuery: string;
  totalCount: number;
  onExport?: () => void;
  onClearGroupFilters: () => void;
  onGroupFiltersChange: (groups: string[]) => void;
  onIncludeUngroupedChange: (checked: boolean) => void;
  onProtocolFilterChange: (protocol: string) => void;
  onSearchQueryChange: (query: string) => void;
};

export function NodeFilters({
  exportDisabled = false,
  groups,
  groupFilters,
  includeUngrouped,
  nodeCount,
  protocolFilter,
  protocols,
  searchQuery,
  totalCount,
  onExport,
  onClearGroupFilters,
  onGroupFiltersChange,
  onIncludeUngroupedChange,
  onProtocolFilterChange,
  onSearchQueryChange
}: NodeFiltersProps) {
  const selectedGroupCount = groupFilters.length + (includeUngrouped ? 1 : 0);

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
      <FilterField className="min-w-[240px] flex-1 max-[720px]:min-w-full" label="分组筛选">
        <div className="flex flex-wrap items-center gap-2 max-[720px]:items-stretch">
          <TagInput
            ariaLabel="分组筛选"
            className="min-w-0 flex-1"
            onChange={onGroupFiltersChange}
            placeholder="输入分组并回车，多选筛选"
            suggestions={groups}
            value={groupFilters}
          />
          <Button
            className="shrink-0"
            onClick={() => onIncludeUngroupedChange(!includeUngrouped)}
            type="button"
            variant={includeUngrouped ? "info" : "outline"}
            size="sm"
          >
            {UNGROUPED_GROUP_LABEL}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="shrink-0" type="button" variant="outline" size="sm">
                快速选择
                {selectedGroupCount > 0 ? <Badge variant="secondary">{selectedGroupCount}</Badge> : null}
                <ChevronDown data-icon="inline-end" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <div className="grid gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="grid gap-0.5">
                    <span className="text-sm font-semibold">快速选择</span>
                    <span className="text-xs text-muted-foreground">点击可多选，也可在左侧直接输入</span>
                  </div>
                  <Button disabled={selectedGroupCount === 0} onClick={onClearGroupFilters} type="button" variant="ghost" size="xs">
                    清空
                  </Button>
                </div>
                <div className="grid gap-1">
                  <GroupFilterItem
                    checked={includeUngrouped}
                    label={UNGROUPED_GROUP_LABEL}
                    onClick={() => onIncludeUngroupedChange(!includeUngrouped)}
                  />
                  <div className="h-px bg-border" />
                  <div className="max-h-56 overflow-y-auto pr-1">
                    <div className="grid gap-1">
                      {groups.length === 0 ? (
                        <div className="px-2 py-3 text-xs text-muted-foreground">暂无可选分组</div>
                      ) : (
                        groups.map((group) => (
                          <GroupFilterItem
                            checked={groupFilters.includes(group)}
                            key={group}
                            label={group}
                            onClick={() =>
                              onGroupFiltersChange(
                                groupFilters.includes(group) ? groupFilters.filter((value) => value !== group) : [...groupFilters, group]
                              )
                            }
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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

function GroupFilterItem({
  checked,
  label,
  onClick
}: {
  checked: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        checked && "bg-primary/10 text-primary"
      )}
      onClick={onClick}
      type="button"
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-sm border",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"
        )}
      >
        {checked ? <Check data-icon="inline-start" /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

type NodeBatchBarProps = {
  batchGroups: string[];
  groups: string[];
  pending: boolean;
  selectedCount: number;
  onAction: (action: NodeBatchActionInput["action"]) => void;
  onBatchGroupsChange: (groups: string[]) => void;
  onClearSelection: () => void;
};

export function NodeBatchBar({
  batchGroups,
  groups,
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
        <TagInput
          ariaLabel="批量分组"
          disabled={disabled}
          onChange={onBatchGroupsChange}
          placeholder="回车添加分组"
          suggestions={groups}
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

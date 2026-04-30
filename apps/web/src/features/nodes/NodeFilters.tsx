import type { NodeBatchActionInput } from "@smagicalsub/shared";

type NodeFiltersProps = {
  groups: string[];
  groupFilter: string;
  searchQuery: string;
  onGroupFilterChange: (group: string) => void;
  onSearchQueryChange: (query: string) => void;
};

export function NodeFilters({ groups, groupFilter, searchQuery, onGroupFilterChange, onSearchQueryChange }: NodeFiltersProps) {
  return (
    <div className="filter-row">
      <label>
        <span>搜索节点</span>
        <input
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="名称 / 协议 / 服务端 / 分组"
          type="search"
          value={searchQuery}
        />
      </label>
      <label>
        <span>分组筛选</span>
        <select onChange={(event) => onGroupFilterChange(event.target.value)} value={groupFilter}>
          <option value="all">全部节点</option>
          <option value="ungrouped">未分组</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </label>
    </div>
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
    <div className="filter-row batch-row">
      <span className="muted-text">已选择 {selectedCount} 个节点</span>
      <label>
        <span>批量分组</span>
        <input
          disabled={disabled}
          onChange={(event) => onBatchGroupsChange(event.target.value)}
          placeholder="香港,日本,备用"
          type="text"
          value={batchGroups}
        />
      </label>
      <button className="secondary-button" disabled={disabled} onClick={() => onAction("enable")} type="button">
        启用
      </button>
      <button className="secondary-button" disabled={disabled} onClick={() => onAction("disable")} type="button">
        停用
      </button>
      <button className="secondary-button" disabled={disabled} onClick={() => onAction("set-groups")} type="button">
        覆盖分组
      </button>
      <button className="secondary-button" disabled={disabled} onClick={() => onAction("append-groups")} type="button">
        追加分组
      </button>
      <button className="danger-button" disabled={disabled} onClick={() => onAction("delete")} type="button">
        删除
      </button>
      <button className="inline-button" disabled={disabled} onClick={onClearSelection} type="button">
        清空选择
      </button>
    </div>
  );
}

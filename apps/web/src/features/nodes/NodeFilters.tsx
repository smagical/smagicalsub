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

type NodeFiltersProps = {
  groups: string[];
  groupFilter: string;
  onGroupFilterChange: (group: string) => void;
};

export function NodeFilters({ groups, groupFilter, onGroupFilterChange }: NodeFiltersProps) {
  return (
    <div className="filter-row">
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


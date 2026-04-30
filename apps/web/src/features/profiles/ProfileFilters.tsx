type ProfileFiltersProps = {
  searchQuery: string;
  statusFilter: string;
  onSearchQueryChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
};

export function ProfileFilters({ searchQuery, statusFilter, onSearchQueryChange, onStatusFilterChange }: ProfileFiltersProps) {
  return (
    <div className="filter-row">
      <label>
        <span>搜索配置档</span>
        <input
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="名称 / 策略 / 描述"
          type="search"
          value={searchQuery}
        />
      </label>
      <label>
        <span>状态筛选</span>
        <select onChange={(event) => onStatusFilterChange(event.target.value)} value={statusFilter}>
          <option value="all">全部配置档</option>
          <option value="enabled">已启用</option>
          <option value="disabled">已停用</option>
        </select>
      </label>
    </div>
  );
}

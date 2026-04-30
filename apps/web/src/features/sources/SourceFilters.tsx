type SourceFiltersProps = {
  pending: boolean;
  searchQuery: string;
  sourceCount: number;
  statusFilter: string;
  onRefreshAll: () => void;
  onSearchQueryChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
};

export function SourceFilters({
  pending,
  searchQuery,
  sourceCount,
  statusFilter,
  onRefreshAll,
  onSearchQueryChange,
  onStatusFilterChange
}: SourceFiltersProps) {
  return (
    <div className="filter-row">
      <label>
        <span>搜索订阅源</span>
        <input onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="名称 / 链接 / 错误" type="search" value={searchQuery} />
      </label>
      <label>
        <span>状态筛选</span>
        <select onChange={(event) => onStatusFilterChange(event.target.value)} value={statusFilter}>
          <option value="all">全部订阅源</option>
          <option value="enabled">已启用</option>
          <option value="disabled">已停用</option>
          <option value="success">刷新成功</option>
          <option value="failed">刷新失败</option>
          <option value="never">未刷新</option>
        </select>
      </label>
      <button className="secondary-button" disabled={pending || sourceCount === 0} onClick={onRefreshAll} type="button">
        刷新全部启用
      </button>
    </div>
  );
}

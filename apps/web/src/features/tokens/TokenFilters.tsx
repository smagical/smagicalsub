import { tokenSubscriptionFormats, type TokenSubscriptionFormat } from "./types";

type TokenFiltersProps = {
  copyFormat: TokenSubscriptionFormat;
  searchQuery: string;
  onCopyFormatChange: (format: TokenSubscriptionFormat) => void;
  onSearchQueryChange: (query: string) => void;
};

export function TokenFilters({ copyFormat, searchQuery, onCopyFormatChange, onSearchQueryChange }: TokenFiltersProps) {
  return (
    <div className="filter-row">
      <label>
        <span>搜索令牌</span>
        <input onChange={(event) => onSearchQueryChange(event.target.value)} placeholder="名称 / 令牌 / 配置档" type="search" value={searchQuery} />
      </label>
      <label>
        <span>复制格式</span>
        <select onChange={(event) => onCopyFormatChange(event.target.value as TokenSubscriptionFormat)} value={copyFormat}>
          {tokenSubscriptionFormats.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

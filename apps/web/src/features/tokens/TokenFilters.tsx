import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { FilterBar } from "../../shared/FilterBar";
import { FilterField } from "../../shared/FilterField";
import { tokenFormatHints, tokenSubscriptionFormats, type TokenSubscriptionFormat } from "./types";

type TokenFiltersProps = {
  copyFormat: TokenSubscriptionFormat;
  exportDisabled: boolean;
  searchQuery: string;
  onCopyFormatChange: (format: TokenSubscriptionFormat) => void;
  onExport: () => void;
  onSearchQueryChange: (query: string) => void;
};

export function TokenFilters({
  copyFormat,
  exportDisabled,
  searchQuery,
  onCopyFormatChange,
  onExport,
  onSearchQueryChange
}: TokenFiltersProps) {
  return (
    <FilterBar>
      <FilterField label="搜索令牌">
        <Input
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="名称 / 令牌 / 配置档"
          type="search"
          value={searchQuery}
        />
      </FilterField>
      <FilterField label="复制格式">
        <NativeSelect onChange={(event) => onCopyFormatChange(event.target.value as TokenSubscriptionFormat)} value={copyFormat}>
          {tokenSubscriptionFormats.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </NativeSelect>
      </FilterField>
      <span className="min-w-[220px] text-sm text-muted-foreground">{tokenFormatHints[copyFormat]}</span>
      <Button disabled={exportDisabled} onClick={onExport} type="button" variant="outline">
        导出 CSV
      </Button>
    </FilterBar>
  );
}

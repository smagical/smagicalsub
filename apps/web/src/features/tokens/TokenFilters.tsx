import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Download, Search } from "lucide-react";
import { FilterBar } from "../../shared/FilterBar";
import { FilterField } from "../../shared/FilterField";
import { tokenSubscriptionFormats, type TokenSubscriptionFormat } from "./types";

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
    <FilterBar align="start" className="rounded-xl border bg-card/85 p-3">
      <FilterField className="min-w-[280px] flex-1 max-[720px]:min-w-full" label="搜索令牌">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="名称 / 令牌 / 配置档"
            type="search"
            value={searchQuery}
          />
        </div>
      </FilterField>
      <FilterField className="min-w-[180px] max-[720px]:min-w-full" label="复制格式">
        <NativeSelect onChange={(event) => onCopyFormatChange(event.target.value as TokenSubscriptionFormat)} value={copyFormat}>
          {tokenSubscriptionFormats.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </NativeSelect>
      </FilterField>
      <Button className="self-end" disabled={exportDisabled} onClick={onExport} type="button" variant="outline">
        <Download data-icon="inline-start" />
        导出 CSV
      </Button>
    </FilterBar>
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Download, Search } from "lucide-react";
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
    <FilterBar className="rounded-xl bg-card/85">
      <FilterField label="搜索令牌">
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
      <FilterField label="复制格式">
        <NativeSelect onChange={(event) => onCopyFormatChange(event.target.value as TokenSubscriptionFormat)} value={copyFormat}>
          {tokenSubscriptionFormats.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </NativeSelect>
      </FilterField>
      <span className="min-w-[220px] rounded-lg border bg-background/65 px-3 py-2 text-sm text-muted-foreground">{tokenFormatHints[copyFormat]}</span>
      <Button disabled={exportDisabled} onClick={onExport} type="button" variant="outline">
        <Download data-icon="inline-start" />
        导出 CSV
      </Button>
    </FilterBar>
  );
}

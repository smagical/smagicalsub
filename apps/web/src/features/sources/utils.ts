import type { SourceDto } from "@smagicalsub/shared";
import { downloadCsv } from "../../lib/download-csv";
import { normalizedInterval, refreshIntervalOptions } from "./SourceForm";

export function filterSources(sources: SourceDto[], searchQuery: string, statusFilter: string) {
  const query = searchQuery.trim().toLowerCase();

  return sources.filter((source) => {
    const statusMatches =
      statusFilter === "all" ||
      (statusFilter === "enabled" && source.enabled === 1) ||
      (statusFilter === "disabled" && source.enabled !== 1) ||
      (statusFilter === "never" && !source.last_status) ||
      source.last_status === statusFilter;
    const searchMatches =
      !query ||
      [
        source.name,
        source.url,
        ...source.groups,
        source.last_status ?? "",
        source.last_error ?? "",
        source.last_fetched_at ?? "",
        refreshIntervalLabel(source.refresh_interval_minutes),
        source.next_refresh_at ?? ""
      ].some((value) => value.toLowerCase().includes(query));

    return statusMatches && searchMatches;
  });
}

export function exportSourcesCsv(sources: SourceDto[]) {
  const rows = sources.map((source) => [
    source.name,
    source.url,
    source.groups.length > 0 ? source.groups.join(",") : "默认",
    source.enabled ? "启用" : "停用",
    refreshIntervalLabel(source.refresh_interval_minutes),
    source.next_refresh_at ?? "",
    source.last_status ?? "未刷新",
    source.last_fetched_at ?? "",
    source.last_error ?? "",
    source.created_at,
    source.updated_at
  ]);

  downloadCsv("sources", [["名称", "链接", "默认分组", "状态", "定时刷新", "下次刷新", "刷新结果", "最后刷新", "错误信息", "创建时间", "更新时间"], ...rows]);
}

function refreshIntervalLabel(minutes: number | null | undefined) {
  const value = minutes ?? 0;
  const option = refreshIntervalOptions.find((item) => normalizedInterval(item.value) === value);

  return option?.label ?? `每 ${value} 分钟`;
}

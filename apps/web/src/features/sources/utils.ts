import type { SourceDto } from "@smagicalsub/shared";
import { downloadCsv } from "../../lib/download-csv";

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
      [source.name, source.url, source.last_status ?? "", source.last_error ?? "", source.last_fetched_at ?? ""].some((value) =>
        value.toLowerCase().includes(query)
      );

    return statusMatches && searchMatches;
  });
}

export function exportSourcesCsv(sources: SourceDto[]) {
  const rows = sources.map((source) => [
    source.name,
    source.url,
    source.enabled ? "启用" : "停用",
    source.last_status ?? "未刷新",
    source.last_fetched_at ?? "",
    source.last_error ?? "",
    source.created_at,
    source.updated_at
  ]);

  downloadCsv("sources", [["名称", "链接", "状态", "刷新结果", "最后刷新", "错误信息", "创建时间", "更新时间"], ...rows]);
}

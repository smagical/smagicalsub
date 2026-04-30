import { useMemo, useState } from "react";
import type { AccessLogDto } from "@smagicalsub/shared";
import { useQuery } from "@tanstack/react-query";
import { downloadCsv } from "../../lib/download-csv";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleHeading } from "../../shared/ModuleHeading";
import { listAccessLogs } from "./api";
import { LogsTable } from "./LogsTable";

export function LogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenFilter, setTokenFilter] = useState("all");
  const [notice, setNotice] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["logs"],
    queryFn: listAccessLogs,
    retry: false
  });
  const logs = query.data?.items ?? [];
  const filteredLogs = useMemo(
    () => logs.filter((log) => matchesLogTokenState(log, tokenFilter) && matchesLogSearch(log, searchQuery)),
    [logs, searchQuery, tokenFilter]
  );
  const emptyLabel = logs.length === 0 ? "还没有访问日志" : "没有匹配的访问日志";

  async function copyPath(path: string) {
    if (!navigator.clipboard) {
      setNotice("当前浏览器不支持自动复制，请手动复制访问路径");
      return;
    }

    await navigator.clipboard.writeText(logUrl(path));
    setNotice("访问地址已复制");
  }

  function openPath(path: string) {
    window.open(logUrl(path), "_blank", "noopener,noreferrer");
  }

  function exportCsv() {
    downloadCsv("access-logs", toLogsCsvRows(filteredLogs));
  }

  return (
    <section className="panel wide">
      <ModuleHeading eyebrow="Logs" title="访问日志" description="查看最近 100 条订阅访问记录，用于排查令牌和客户端请求。" />
      <div className="filter-row">
        <label>
          <span>搜索日志</span>
          <input
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="令牌 / 路径 / IP / User Agent"
            type="search"
            value={searchQuery}
          />
        </label>
        <label>
          <span>令牌状态</span>
          <select onChange={(event) => setTokenFilter(event.target.value)} value={tokenFilter}>
            <option value="all">全部日志</option>
            <option value="active-token">现有令牌</option>
            <option value="deleted-token">已删除令牌</option>
          </select>
        </label>
        <button className="secondary-button" disabled={filteredLogs.length === 0} onClick={exportCsv} type="button">导出 CSV</button>
      </div>

      {notice ? <p className="success-text">{notice}</p> : null}
      {query.error instanceof Error ? <p className="error-text">{query.error.message}</p> : null}

      {filteredLogs.length === 0 ? <EmptyState label={emptyLabel} /> : <LogsTable logs={filteredLogs} onCopyPath={(path) => void copyPath(path)} onOpenPath={openPath} />}
    </section>
  );
}

function logUrl(path: string) {
  return typeof window === "undefined" ? path : new URL(path, window.location.origin).toString();
}

function toLogsCsvRows(logs: AccessLogDto[]) {
  const rows = logs.map((log) => [
    log.created_at,
    log.token_name ?? "已删除令牌",
    log.path,
    log.ip ?? "",
    log.user_agent ?? ""
  ]);

  return [["时间", "令牌", "路径", "IP", "User Agent"], ...rows];
}

function matchesLogTokenState(log: AccessLogDto, tokenFilter: string) {
  if (tokenFilter === "active-token") {
    return log.token_name !== null;
  }

  if (tokenFilter === "deleted-token") {
    return log.token_name === null;
  }

  return true;
}

function matchesLogSearch(log: AccessLogDto, searchQuery: string) {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [log.token_name ?? "已删除令牌", log.path, log.ip ?? "", log.user_agent ?? "", log.created_at].some((value) =>
    value.toLowerCase().includes(query)
  );
}

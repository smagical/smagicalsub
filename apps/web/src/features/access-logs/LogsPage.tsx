import { useMemo, useState } from "react";
import type { AccessLogDto } from "@smagicalsub/shared";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleHeading } from "../../shared/ModuleHeading";
import { listAccessLogs } from "./api";
import { LogsTable } from "./LogsTable";

export function LogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenFilter, setTokenFilter] = useState("all");
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
      </div>

      {query.error instanceof Error ? <p className="error-text">{query.error.message}</p> : null}

      {filteredLogs.length === 0 ? <EmptyState label={emptyLabel} /> : <LogsTable logs={filteredLogs} />}
    </section>
  );
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

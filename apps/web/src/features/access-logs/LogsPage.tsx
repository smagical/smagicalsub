import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleHeading } from "../../shared/ModuleHeading";
import { listAccessLogs } from "./api";
import { LogsTable } from "./LogsTable";

export function LogsPage() {
  const query = useQuery({
    queryKey: ["logs"],
    queryFn: listAccessLogs,
    retry: false
  });
  const logs = query.data?.items ?? [];

  return (
    <section className="panel wide">
      <ModuleHeading eyebrow="Logs" title="访问日志" description="查看最近 100 条订阅访问记录，用于排查令牌和客户端请求。" />

      {query.error instanceof Error ? <p className="error-text">{query.error.message}</p> : null}

      {logs.length === 0 ? <EmptyState label="还没有访问日志" /> : <LogsTable logs={logs} />}
    </section>
  );
}

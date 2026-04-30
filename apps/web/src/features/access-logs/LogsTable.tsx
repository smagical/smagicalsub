import type { AccessLogDto } from "@smagicalsub/shared";

type LogsTableProps = {
  logs: AccessLogDto[];
};

export function LogsTable({ logs }: LogsTableProps) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>时间</th>
          <th>令牌</th>
          <th>路径</th>
          <th>IP</th>
          <th>User Agent</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <td>{log.created_at}</td>
            <td>{log.token_name ?? "已删除令牌"}</td>
            <td className="mono-cell">{log.path}</td>
            <td>{log.ip ?? "-"}</td>
            <td className="truncate-cell">{log.user_agent ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

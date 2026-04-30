import type { AccessLogDto } from "@smagicalsub/shared";

type LogsTableProps = {
  logs: AccessLogDto[];
  onCopyPath: (path: string) => void;
  onOpenPath: (path: string) => void;
};

export function LogsTable({ logs, onCopyPath, onOpenPath }: LogsTableProps) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>时间</th>
          <th>令牌</th>
          <th>路径</th>
          <th>IP</th>
          <th>User Agent</th>
          <th>操作</th>
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
            <td>
              <div className="table-actions">
                <button className="secondary-button" onClick={() => onCopyPath(log.path)} type="button">复制</button>
                <button className="inline-button" onClick={() => onOpenPath(log.path)} type="button">打开</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

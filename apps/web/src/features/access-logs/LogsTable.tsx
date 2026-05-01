import { Button } from "@/components/ui/button";
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
                <Button onClick={() => onCopyPath(log.path)} size="sm" type="button" variant="outline">复制</Button>
                <Button onClick={() => onOpenPath(log.path)} size="sm" type="button" variant="ghost">打开</Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

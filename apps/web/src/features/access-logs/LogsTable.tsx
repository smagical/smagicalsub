import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AccessLogDto } from "@smagicalsub/shared";
import { ActionGroup } from "../../shared/ActionGroup";

type LogsTableProps = {
  logs: AccessLogDto[];
  onCopyPath: (path: string) => void;
  onOpenPath: (path: string) => void;
};

export function LogsTable({ logs, onCopyPath, onOpenPath }: LogsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>时间</TableHead>
          <TableHead>令牌</TableHead>
          <TableHead>路径</TableHead>
          <TableHead>IP</TableHead>
          <TableHead>User Agent</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>{log.created_at}</TableCell>
            <TableCell>{log.token_name ?? "已删除令牌"}</TableCell>
            <TableCell className="mono-cell">{log.path}</TableCell>
            <TableCell>{log.ip ?? "-"}</TableCell>
            <TableCell className="truncate-cell">{log.user_agent ?? "-"}</TableCell>
            <TableCell>
              <ActionGroup>
                <Button onClick={() => onCopyPath(log.path)} size="sm" type="button" variant="outline">复制</Button>
                <Button onClick={() => onOpenPath(log.path)} size="sm" type="button" variant="ghost">打开</Button>
              </ActionGroup>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

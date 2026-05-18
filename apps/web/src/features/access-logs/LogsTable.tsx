import { Badge } from "@/components/ui/badge";
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
    <div className="overflow-hidden rounded-lg border bg-card/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
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
            <TableRow className="hover:bg-muted/35" key={log.id}>
              <TableCell className="font-mono text-xs">{log.created_at}</TableCell>
              <TableCell>{log.token_name ? <Badge variant="secondary">{log.token_name}</Badge> : "已删除令牌"}</TableCell>
              <TableCell className="font-mono text-xs">{log.path}</TableCell>
              <TableCell className="font-mono text-xs">{log.ip ?? "-"}</TableCell>
              <TableCell className="max-w-md truncate">{log.user_agent ?? "-"}</TableCell>
              <TableCell>
                <ActionGroup>
                  <Button onClick={() => onCopyPath(log.path)} size="sm" type="button" variant="outline">
                    复制
                  </Button>
                  <Button onClick={() => onOpenPath(log.path)} size="sm" type="button" variant="ghost">
                    打开
                  </Button>
                </ActionGroup>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

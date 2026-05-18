import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SessionDto } from "@smagicalsub/shared";
import { ConfirmButton } from "../../shared/ConfirmButton";

type SessionsTableProps = {
  pending: boolean;
  sessions: SessionDto[];
  onRevoke: (id: string) => void;
};

export function SessionsTable({ pending, sessions, onRevoke }: SessionsTableProps) {
  if (sessions.length === 0) {
    return (
      <Empty className="min-h-[140px]">
        <EmptyHeader>
          <EmptyTitle>{pending ? "正在读取登录会话" : "暂无登录会话"}</EmptyTitle>
          <EmptyDescription>会话数据只展示当前账号的有效登录记录。</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>会话</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>过期时间</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell>{session.current ? <Badge>当前会话</Badge> : <Badge variant="secondary">其他会话</Badge>}</TableCell>
              <TableCell className="font-mono text-xs">{session.created_at}</TableCell>
              <TableCell className="font-mono text-xs">{session.expires_at}</TableCell>
              <TableCell>
                <ConfirmButton
                  description="撤销后，该会话需要重新登录才能继续访问控制台。"
                  disabled={pending || session.current}
                  onConfirm={() => onRevoke(session.id)}
                  title="撤销这个登录会话？"
                  variant="outline"
                >
                  撤销
                </ConfirmButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UserDto, UserRole } from "@smagicalsub/shared";
import { ConfirmButton } from "../../shared/ConfirmButton";

type UsersTableProps = {
  currentUserId?: string;
  passwordDrafts: Record<string, string>;
  pending: boolean;
  users: UserDto[];
  onDelete: (user: UserDto) => void;
  onPasswordChange: (id: string, password: string) => void;
  onRoleChange: (user: UserDto, role: UserRole) => void;
  onSavePassword: (user: UserDto) => void;
};

export function UsersTable({
  currentUserId,
  passwordDrafts,
  pending,
  users,
  onDelete,
  onPasswordChange,
  onRoleChange,
  onSavePassword
}: UsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>名称</TableHead>
          <TableHead>邮箱</TableHead>
          <TableHead>角色</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead>重置密码</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex flex-wrap items-center gap-2">
                <span>{user.name ?? "未命名"}</span>
                {user.protected ? <Badge variant="secondary">受保护</Badge> : null}
              </div>
            </TableCell>
            <TableCell className="font-mono">{user.email}</TableCell>
            <TableCell>{roleSelect(user, pending, onRoleChange)}</TableCell>
            <TableCell>{user.created_at}</TableCell>
            <TableCell>{passwordReset(user, passwordDrafts[user.id] ?? "", pending, onPasswordChange, onSavePassword)}</TableCell>
            <TableCell>
              <ConfirmButton
                description="删除用户会清理该用户的登录会话，但不会删除已经创建的订阅数据。"
                disabled={pending || user.id === currentUserId || Boolean(user.protected)}
                onConfirm={() => onDelete(user)}
                title={`删除用户「${user.name ?? user.email}」？`}
                variant="destructive"
              >
                删除
              </ConfirmButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function roleSelect(user: UserDto, pending: boolean, onRoleChange: (user: UserDto, role: UserRole) => void) {
  return (
    <NativeSelect disabled={pending || Boolean(user.protected)} onChange={(event) => onRoleChange(user, event.target.value as UserRole)} value={user.role}>
      <option value="user">用户</option>
      <option value="admin">管理员</option>
    </NativeSelect>
  );
}

function passwordReset(
  user: UserDto,
  password: string,
  pending: boolean,
  onPasswordChange: (id: string, password: string) => void,
  onSavePassword: (user: UserDto) => void
) {
  return (
    <div className="flex min-w-[220px] gap-2">
      <Input disabled={pending || Boolean(user.protected)} onChange={(event) => onPasswordChange(user.id, event.target.value)} placeholder={user.protected ? "受保护管理员" : "新密码"} type="password" value={password} />
      <Button disabled={pending || Boolean(user.protected) || password.length < 8} onClick={() => onSavePassword(user)} type="button" variant="outline">
        保存
      </Button>
    </div>
  );
}

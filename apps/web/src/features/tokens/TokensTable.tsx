import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { NodeDto, ProfileDto, SubscribeTokenDto } from "@smagicalsub/shared";
import type { ReactNode } from "react";
import { CalendarClock, KeyRound, Link2 } from "lucide-react";
import { StatusBadge } from "../../shared/StatusBadge";
import { TokenActions } from "./TokenActions";
import { TokenExpiresCell, TokenNodeScopeCell, TokenPathCell, TokenProfileCell } from "./TokenScopeCell";
import type { TokenEditFormState, TokenSubscriptionFormat } from "./types";
import { maskToken } from "./utils";

type TokensTableProps = {
  copyFormat: TokenSubscriptionFormat;
  editForm: TokenEditFormState;
  editingTokenId: string | null;
  pending: boolean;
  nodes: NodeDto[];
  profiles: ProfileDto[];
  tokens: SubscribeTokenDto[];
  onCancelEdit: () => void;
  onCopy: (token: SubscribeTokenDto) => void;
  onDelete: (token: SubscribeTokenDto) => void;
  onEditFormChange: (form: TokenEditFormState) => void;
  onOpen: (token: SubscribeTokenDto) => void;
  onProfileChange: (token: SubscribeTokenDto, profileId: string | null) => void;
  onReset: (token: SubscribeTokenDto) => void;
  onSaveEdit: (token: SubscribeTokenDto) => void;
  onStartEdit: (token: SubscribeTokenDto) => void;
  onToggleEnabled: (token: SubscribeTokenDto) => void;
};

export function TokensTable({
  copyFormat,
  editForm,
  editingTokenId,
  nodes,
  pending,
  profiles,
  tokens,
  onCancelEdit,
  onCopy,
  onDelete,
  onEditFormChange,
  onOpen,
  onProfileChange,
  onReset,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled
}: TokensTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/35 px-4 py-3">
        <div className="grid gap-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-chart-2">
            <KeyRound />
            令牌列表
          </div>
          <p className="text-xs text-muted-foreground">在这里编辑路径、配置档、节点范围和状态。</p>
        </div>
        <span className="rounded-md border bg-background/70 px-3 py-1.5 text-sm font-medium">{tokens.length} 个令牌</span>
      </div>
      <div className="hidden overflow-x-auto lg:block">
        <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead>名称</TableHead>
            <TableHead>令牌</TableHead>
            <TableHead>配置档</TableHead>
            <TableHead>节点范围</TableHead>
            <TableHead>订阅路径</TableHead>
            <TableHead>过期时间</TableHead>
            <TableHead>最近使用</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token) => {
            const editing = editingTokenId === token.id;

            return (
              <TableRow className="hover:bg-muted/35" key={token.id}>
                <TableCell className="font-medium">
                  {editing ? (
                    <Input
                      aria-label="令牌名称"
                      disabled={pending}
                      onChange={(event) => onEditFormChange({ ...editForm, name: event.target.value })}
                      type="text"
                      value={editForm.name}
                    />
                  ) : (
                    token.name
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{maskToken(token.token)}</TableCell>
                <TableCell>
                  <TokenProfileCell pending={pending} profiles={profiles} token={token} onProfileChange={onProfileChange} />
                </TableCell>
                <TableCell>
                  <TokenNodeScopeCell
                    editForm={editForm}
                    editing={editing}
                    nodes={nodes}
                    pending={pending}
                    token={token}
                    onEditFormChange={onEditFormChange}
                  />
                </TableCell>
                <TableCell className="max-w-md truncate font-mono text-xs">
                  <TokenPathCell
                    copyFormat={copyFormat}
                    editForm={editForm}
                    editing={editing}
                    pending={pending}
                    token={token}
                    onEditFormChange={onEditFormChange}
                  />
                </TableCell>
                <TableCell>
                  <TokenExpiresCell
                    editForm={editForm}
                    editing={editing}
                    pending={pending}
                    token={token}
                    onEditFormChange={onEditFormChange}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs">{token.last_used_at ?? "未使用"}</TableCell>
                <TableCell>
                  <StatusBadge enabled={token.enabled} />
                </TableCell>
                <TableCell>
                  <TokenActions
                    editing={editing}
                    pending={pending}
                    token={token}
                    onCancelEdit={onCancelEdit}
                    onCopy={onCopy}
                    onDelete={onDelete}
                    onOpen={onOpen}
                    onReset={onReset}
                    onSaveEdit={onSaveEdit}
                    onStartEdit={onStartEdit}
                    onToggleEnabled={onToggleEnabled}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        </Table>
      </div>
      <div className="grid gap-3 p-3 lg:hidden">
        {tokens.map((token) => {
          const editing = editingTokenId === token.id;

          return (
            <article className="grid gap-3 rounded-xl border bg-background/75 p-3" key={token.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="grid min-w-0 gap-1">
                  {editing ? (
                    <Input
                      aria-label="令牌名称"
                      disabled={pending}
                      onChange={(event) => onEditFormChange({ ...editForm, name: event.target.value })}
                      type="text"
                      value={editForm.name}
                    />
                  ) : (
                    <h3 className="truncate font-semibold">{token.name}</h3>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">{maskToken(token.token)}</span>
                </div>
                <StatusBadge enabled={token.enabled} />
              </div>

              <div className="grid gap-2 text-sm">
                <MobileTokenField icon={KeyRound} label="配置档">
                  <TokenProfileCell pending={pending} profiles={profiles} token={token} onProfileChange={onProfileChange} />
                </MobileTokenField>
                <MobileTokenField icon={Link2} label="订阅路径">
                  <span className="break-all font-mono text-xs">
                    <TokenPathCell
                      copyFormat={copyFormat}
                      editForm={editForm}
                      editing={editing}
                      pending={pending}
                      token={token}
                      onEditFormChange={onEditFormChange}
                    />
                  </span>
                </MobileTokenField>
                <MobileTokenField icon={CalendarClock} label="过期时间">
                  <TokenExpiresCell
                    editForm={editForm}
                    editing={editing}
                    pending={pending}
                    token={token}
                    onEditFormChange={onEditFormChange}
                  />
                </MobileTokenField>
                <MobileTokenField icon={KeyRound} label="节点范围">
                  <TokenNodeScopeCell
                    editForm={editForm}
                    editing={editing}
                    nodes={nodes}
                    pending={pending}
                    token={token}
                    onEditFormChange={onEditFormChange}
                  />
                </MobileTokenField>
              </div>

              <div className="rounded-lg border bg-muted/30 p-2">
                <TokenActions
                  editing={editing}
                  pending={pending}
                  token={token}
                  onCancelEdit={onCancelEdit}
                  onCopy={onCopy}
                  onDelete={onDelete}
                  onOpen={onOpen}
                  onReset={onReset}
                  onSaveEdit={onSaveEdit}
                  onStartEdit={onStartEdit}
                  onToggleEnabled={onToggleEnabled}
                />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function MobileTokenField({ children, icon: Icon, label }: { children: ReactNode; icon: typeof KeyRound; label: string }) {
  return (
    <div className="grid gap-1 rounded-lg border bg-card/70 p-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="text-primary" />
        {label}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

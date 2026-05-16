import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { NodeDto, ProfileDto, ProfileModuleDto, SubscribeTokenDto } from "@smagicalsub/shared";
import type { ReactNode } from "react";
import { CalendarClock, Check, KeyRound, Link2 } from "lucide-react";
import { StatusBadge } from "../../shared/StatusBadge";
import { TokenActions } from "./TokenActions";
import { TokenEditForm } from "./TokenForm";
import { TokenExpiresCell, TokenNodeScopeCell, TokenPathCell, TokenProfileCell } from "./TokenScopeCell";
import type { TokenEditFormState, TokenSubscriptionFormat } from "./types";
import { maskToken } from "./utils";

type TokensTableProps = {
  copyFormat: TokenSubscriptionFormat;
  editForm: TokenEditFormState;
  editingTokenId: string | null;
  pending: boolean;
  nodes: NodeDto[];
  profileModules: ProfileModuleDto[];
  profiles: ProfileDto[];
  tokens: SubscribeTokenDto[];
  total: number;
  onCancelEdit: () => void;
  onCopy: (token: SubscribeTokenDto) => void;
  onDelete: (token: SubscribeTokenDto) => void;
  onEditFormChange: (form: TokenEditFormState) => void;
  onOpen: (token: SubscribeTokenDto) => void;
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
  profileModules,
  profiles,
  tokens,
  total,
  onCancelEdit,
  onCopy,
  onDelete,
  onEditFormChange,
  onOpen,
  onReset,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled
}: TokensTableProps) {
  const editingToken = tokens.find((token) => token.id === editingTokenId) ?? null;

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/35 px-4 py-3">
          <div className="grid gap-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-chart-2">
              <KeyRound />
              令牌列表
            </div>
            <p className="text-xs text-muted-foreground">在这里查看令牌状态，点击编辑可在弹窗中维护路径、配置档和节点范围。</p>
          </div>
          <span className="rounded-md border bg-background/70 px-3 py-1.5 text-sm font-medium">
            本页 {tokens.length} / 共 {total}
          </span>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <Table className="[&_th:last-child]:text-right">
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
                    <TableCell className="font-medium">{token.name}</TableCell>
                    <TableCell className="font-mono text-xs">{maskToken(token.token)}</TableCell>
                    <TableCell>
                      <TokenProfileCell profiles={profiles} token={token} />
                    </TableCell>
                    <TableCell>
                      <TokenNodeScopeCell token={token} />
                    </TableCell>
                    <TableCell className="w-[12rem] max-w-[12rem]">
                      <TokenPathCell copyFormat={copyFormat} token={token} />
                    </TableCell>
                    <TableCell>
                      <TokenExpiresCell token={token} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{token.last_used_at ?? "未使用"}</TableCell>
                    <TableCell>
                      <StatusBadge enabled={token.enabled} />
                    </TableCell>
                    <TableCell className="text-right">
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
                    <h3 className="truncate font-semibold">{token.name}</h3>
                    <span className="font-mono text-xs text-muted-foreground">{maskToken(token.token)}</span>
                  </div>
                  <StatusBadge enabled={token.enabled} />
                </div>

                <div className="grid gap-2 text-sm">
                  <MobileTokenField icon={KeyRound} label="配置档">
                    <TokenProfileCell profiles={profiles} token={token} />
                  </MobileTokenField>
                  <MobileTokenField icon={Link2} label="订阅路径">
                    <span className="break-all font-mono text-xs">
                      <TokenPathCell copyFormat={copyFormat} token={token} />
                    </span>
                  </MobileTokenField>
                  <MobileTokenField icon={CalendarClock} label="过期时间">
                    <TokenExpiresCell token={token} />
                  </MobileTokenField>
                  <MobileTokenField icon={KeyRound} label="节点范围">
                    <TokenNodeScopeCell token={token} />
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

      <TokenEditDialog
        editForm={editForm}
        pending={pending}
        profileCount={profiles.length}
        nodeCount={nodes.length}
        profiles={profiles}
        profileModules={profileModules}
        nodes={nodes}
        token={editingToken}
        onCancelEdit={onCancelEdit}
        onEditFormChange={onEditFormChange}
        onSaveEdit={onSaveEdit}
      />
    </>
  );
}

function TokenEditDialog({
  editForm,
  nodeCount,
  nodes,
  pending,
  profileCount,
  profileModules,
  profiles,
  token,
  onCancelEdit,
  onEditFormChange,
  onSaveEdit
}: {
  editForm: TokenEditFormState;
  nodeCount: number;
  nodes: NodeDto[];
  pending: boolean;
  profileCount: number;
  profileModules: ProfileModuleDto[];
  profiles: ProfileDto[];
  token: SubscribeTokenDto | null;
  onCancelEdit: () => void;
  onEditFormChange: (form: TokenEditFormState) => void;
  onSaveEdit: (token: SubscribeTokenDto) => void;
}) {
  return (
    <Dialog open={Boolean(token)} onOpenChange={(open) => (!open ? onCancelEdit() : undefined)}>
      {token ? (
        <DialogContent className="w-[min(94vw,920px)] max-h-[92dvh] gap-3 p-4">
          <DialogHeader>
            <DialogTitle>编辑订阅令牌</DialogTitle>
            <DialogDescription>正在维护「{token.name}」，可调整绑定配置档、节点范围、订阅路径、过期时间和启用状态。</DialogDescription>
          </DialogHeader>
          <DialogBody className="min-h-0 gap-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <EditSummaryTile label="配置档" value={`${profileCount} 个可选`} />
              <EditSummaryTile label="节点库" value={`${nodeCount} 个节点`} />
              <EditSummaryTile label="令牌" value={maskToken(token.token)} />
            </div>
            <TokenEditForm
              form={editForm}
              nodes={nodes}
              pending={pending}
              profileModules={profileModules}
              profiles={profiles}
              onFormChange={onEditFormChange}
            />
          </DialogBody>
          <DialogFooter>
            <Button disabled={pending} onClick={onCancelEdit} type="button" variant="outline">
              取消
            </Button>
            <Button disabled={pending} onClick={() => onSaveEdit(token)} type="button" variant="info">
              <Check data-icon="inline-start" />
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function EditSummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card/70 px-3 py-2">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-semibold">{value}</div>
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

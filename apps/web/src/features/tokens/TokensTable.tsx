import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { NodeDto, ProfileDto, SubscribeTokenDto } from "@smagicalsub/shared";
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
    <div className="overflow-hidden rounded-lg border bg-card/70 shadow-sm ring-1 ring-primary/10">
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
  );
}

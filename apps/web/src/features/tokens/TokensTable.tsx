import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProfileDto, SubscribeTokenDto } from "@smagicalsub/shared";
import { StatusBadge } from "../../shared/StatusBadge";
import { TokenActions } from "./TokenActions";
import type { TokenEditFormState, TokenSubscriptionFormat } from "./types";
import { maskToken, subscriptionFormatPath } from "./utils";

type TokensTableProps = {
  copyFormat: TokenSubscriptionFormat;
  editForm: TokenEditFormState;
  editingTokenId: string | null;
  pending: boolean;
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>名称</TableHead>
          <TableHead>令牌</TableHead>
          <TableHead>配置档</TableHead>
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
            <TableRow key={token.id}>
              <TableCell>
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
              <TableCell className="mono-cell">{maskToken(token.token)}</TableCell>
              <TableCell>{profileSelect(token, profiles, pending, onProfileChange)}</TableCell>
              <TableCell className="mono-cell truncate-cell">{subscriptionFormatPath(token.token, copyFormat)}</TableCell>
              <TableCell>{editing ? editExpiresAt(editForm, pending, onEditFormChange) : token.expires_at ?? "永不过期"}</TableCell>
              <TableCell>{token.last_used_at ?? "未使用"}</TableCell>
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
  );
}
function editExpiresAt(editForm: TokenEditFormState, pending: boolean, onEditFormChange: (form: TokenEditFormState) => void) {
  return (
    <Input
      aria-label="令牌过期时间"
      disabled={pending}
      onChange={(event) => onEditFormChange({ ...editForm, expires_at: event.target.value })}
      type="datetime-local"
      value={editForm.expires_at}
    />
  );
}
function profileSelect(
  token: SubscribeTokenDto,
  profiles: ProfileDto[],
  pending: boolean,
  onProfileChange: (token: SubscribeTokenDto, profileId: string | null) => void
) {
  return (
    <NativeSelect
      disabled={pending}
      onChange={(event) => onProfileChange(token, event.target.value || null)}
      value={token.profile_id ?? ""}
    >
      <option value="">不绑定</option>
      {profiles.map((profile) => (
        <option key={profile.id} value={profile.id}>
          {profile.enabled ? profile.name : `${profile.name}（停用）`}
        </option>
      ))}
      {missingProfileOption(token, profiles)}
    </NativeSelect>
  );
}

function missingProfileOption(token: SubscribeTokenDto, profiles: ProfileDto[]) {
  if (!token.profile_id || profiles.some((profile) => profile.id === token.profile_id)) {
    return null;
  }

  return <option value={token.profile_id}>{token.profile_name ?? "配置档不可用"}</option>;
}

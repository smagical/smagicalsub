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
    <table className="data-table">
      <thead>
        <tr>
          <th>名称</th>
          <th>令牌</th>
          <th>配置档</th>
          <th>订阅路径</th>
          <th>过期时间</th>
          <th>最近使用</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => {
          const editing = editingTokenId === token.id;

          return (
            <tr key={token.id}>
              <td>
                {editing ? (
                  <input
                    aria-label="令牌名称"
                    disabled={pending}
                    onChange={(event) => onEditFormChange({ ...editForm, name: event.target.value })}
                    type="text"
                    value={editForm.name}
                  />
                ) : (
                  token.name
                )}
              </td>
              <td className="mono-cell">{maskToken(token.token)}</td>
              <td>{profileSelect(token, profiles, pending, onProfileChange)}</td>
              <td className="mono-cell truncate-cell">{subscriptionFormatPath(token.token, copyFormat)}</td>
              <td>{editing ? editExpiresAt(editForm, pending, onEditFormChange) : token.expires_at ?? "永不过期"}</td>
              <td>{token.last_used_at ?? "未使用"}</td>
              <td>
                <StatusBadge enabled={token.enabled} />
              </td>
              <td>
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
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
function editExpiresAt(editForm: TokenEditFormState, pending: boolean, onEditFormChange: (form: TokenEditFormState) => void) {
  return (
    <input
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
    <select disabled={pending} onChange={(event) => onProfileChange(token, event.target.value || null)} value={token.profile_id ?? ""}>
      <option value="">不绑定</option>
      {profiles.map((profile) => (
        <option key={profile.id} value={profile.id}>
          {profile.enabled ? profile.name : `${profile.name}（停用）`}
        </option>
      ))}
      {missingProfileOption(token, profiles)}
    </select>
  );
}

function missingProfileOption(token: SubscribeTokenDto, profiles: ProfileDto[]) {
  if (!token.profile_id || profiles.some((profile) => profile.id === token.profile_id)) {
    return null;
  }

  return <option value={token.profile_id}>{token.profile_name ?? "配置档不可用"}</option>;
}

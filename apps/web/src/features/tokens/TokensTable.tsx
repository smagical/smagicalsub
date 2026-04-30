import type { ProfileDto, SubscribeTokenDto } from "@smagicalsub/shared";
import { StatusBadge } from "../../shared/StatusBadge";
import { maskToken, subscriptionPath } from "./utils";

type TokensTableProps = {
  pending: boolean;
  profiles: ProfileDto[];
  tokens: SubscribeTokenDto[];
  onCopy: (token: SubscribeTokenDto) => void;
  onDelete: (token: SubscribeTokenDto) => void;
  onProfileChange: (token: SubscribeTokenDto, profileId: string | null) => void;
  onReset: (token: SubscribeTokenDto) => void;
  onToggleEnabled: (token: SubscribeTokenDto) => void;
};

export function TokensTable({
  pending,
  profiles,
  tokens,
  onCopy,
  onDelete,
  onProfileChange,
  onReset,
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
        {tokens.map((token) => (
          <tr key={token.id}>
            <td>{token.name}</td>
            <td className="mono-cell">{maskToken(token.token)}</td>
            <td>
              <select
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
              </select>
            </td>
            <td className="mono-cell truncate-cell">{subscriptionPath(token.token)}</td>
            <td>{token.expires_at ?? "永不过期"}</td>
            <td>{token.last_used_at ?? "未使用"}</td>
            <td>
              <StatusBadge enabled={token.enabled} />
            </td>
            <td>
              <div className="table-actions">
                <button className="secondary-button" disabled={pending} onClick={() => onCopy(token)} type="button">
                  复制
                </button>
                <button className="secondary-button" disabled={pending} onClick={() => onToggleEnabled(token)} type="button">
                  {token.enabled ? "停用" : "启用"}
                </button>
                <button className="secondary-button" disabled={pending} onClick={() => onReset(token)} type="button">
                  重置
                </button>
                <button className="danger-button" disabled={pending} onClick={() => onDelete(token)} type="button">
                  删除
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function missingProfileOption(token: SubscribeTokenDto, profiles: ProfileDto[]) {
  if (!token.profile_id || profiles.some((profile) => profile.id === token.profile_id)) {
    return null;
  }

  return <option value={token.profile_id}>{token.profile_name ?? "配置档不可用"}</option>;
}

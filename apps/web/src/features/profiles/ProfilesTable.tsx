import type { ProfileDto } from "@smagicalsub/shared";
import { StatusBadge } from "../../shared/StatusBadge";

type ProfilesTableProps = {
  pending: boolean;
  profiles: ProfileDto[];
  onDelete: (profile: ProfileDto) => void;
  onManageRules: (profile: ProfileDto) => void;
  onToggleEnabled: (profile: ProfileDto) => void;
};

export function ProfilesTable({ pending, profiles, onDelete, onManageRules, onToggleEnabled }: ProfilesTableProps) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>名称</th>
          <th>默认策略</th>
          <th>描述</th>
          <th>状态</th>
          <th>更新时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {profiles.map((profile) => (
          <tr key={profile.id}>
            <td>{profile.name}</td>
            <td>{profile.default_strategy}</td>
            <td>{profile.description ?? "-"}</td>
            <td>
              <StatusBadge enabled={profile.enabled} />
            </td>
            <td>{profile.updated_at}</td>
            <td>
              <div className="table-actions">
                <button className="secondary-button" disabled={pending} onClick={() => onToggleEnabled(profile)} type="button">
                  {profile.enabled ? "停用" : "启用"}
                </button>
                <button className="secondary-button" disabled={pending} onClick={() => onManageRules(profile)} type="button">
                  规则
                </button>
                <button className="danger-button" disabled={pending} onClick={() => onDelete(profile)} type="button">
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

import type { ProfileDto } from "@smagicalsub/shared";
import { StatusBadge } from "../../shared/StatusBadge";
import type { ProfileEditFormState } from "./types";

type ProfilesTableProps = {
  editForm: ProfileEditFormState;
  editingProfileId: string | null;
  pending: boolean;
  profiles: ProfileDto[];
  onCancelEdit: () => void;
  onDelete: (profile: ProfileDto) => void;
  onEditFormChange: (form: ProfileEditFormState) => void;
  onManageRules: (profile: ProfileDto) => void;
  onSaveEdit: (profile: ProfileDto) => void;
  onStartEdit: (profile: ProfileDto) => void;
  onToggleEnabled: (profile: ProfileDto) => void;
};

export function ProfilesTable({
  editForm,
  editingProfileId,
  pending,
  profiles,
  onCancelEdit,
  onDelete,
  onEditFormChange,
  onManageRules,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled
}: ProfilesTableProps) {
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
        {profiles.map((profile) => {
          const editing = editingProfileId === profile.id;

          return (
            <tr key={profile.id}>
              <td>{editing ? profileInput("配置档名称", editForm.name, pending, (name) => onEditFormChange({ ...editForm, name })) : profile.name}</td>
              <td>{editing ? profileInput("默认策略", editForm.default_strategy, pending, (default_strategy) => onEditFormChange({ ...editForm, default_strategy })) : profile.default_strategy}</td>
              <td>{editing ? profileInput("配置档描述", editForm.description, pending, (description) => onEditFormChange({ ...editForm, description })) : profile.description ?? "-"}</td>
              <td>
                <StatusBadge enabled={profile.enabled} />
              </td>
              <td>{profile.updated_at}</td>
              <td>
                <ProfileActions
                  editing={editing}
                  pending={pending}
                  profile={profile}
                  onCancelEdit={onCancelEdit}
                  onDelete={onDelete}
                  onManageRules={onManageRules}
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

function profileInput(label: string, value: string, pending: boolean, onChange: (value: string) => void) {
  return <input aria-label={label} disabled={pending} onChange={(event) => onChange(event.target.value)} type="text" value={value} />;
}

function ProfileActions({
  editing,
  pending,
  profile,
  onCancelEdit,
  onDelete,
  onManageRules,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled
}: Pick<ProfilesTableProps, "onCancelEdit" | "onDelete" | "onManageRules" | "onSaveEdit" | "onStartEdit" | "onToggleEnabled" | "pending"> & {
  editing: boolean;
  profile: ProfileDto;
}) {
  if (editing) {
    return (
      <div className="table-actions">
        <button className="primary-button" disabled={pending} onClick={() => onSaveEdit(profile)} type="button">保存</button>
        <button className="secondary-button" disabled={pending} onClick={onCancelEdit} type="button">取消</button>
      </div>
    );
  }

  return (
    <div className="table-actions">
      <button className="secondary-button" disabled={pending} onClick={() => onToggleEnabled(profile)} type="button">{profile.enabled ? "停用" : "启用"}</button>
      <button className="secondary-button" disabled={pending} onClick={() => onManageRules(profile)} type="button">规则</button>
      <button className="secondary-button" disabled={pending} onClick={() => onStartEdit(profile)} type="button">编辑</button>
      <button className="danger-button" disabled={pending} onClick={() => onDelete(profile)} type="button">删除</button>
    </div>
  );
}

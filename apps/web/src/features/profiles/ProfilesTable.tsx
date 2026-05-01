import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProfileDto } from "@smagicalsub/shared";
import { ActionGroup } from "../../shared/ActionGroup";
import { ConfirmButton } from "../../shared/ConfirmButton";
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>名称</TableHead>
          <TableHead>默认策略</TableHead>
          <TableHead>描述</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>更新时间</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.map((profile) => {
          const editing = editingProfileId === profile.id;

          return (
            <TableRow key={profile.id}>
              <TableCell>
                {editing ? profileInput("配置档名称", editForm.name, pending, (name) => onEditFormChange({ ...editForm, name })) : profile.name}
              </TableCell>
              <TableCell>
                {editing
                  ? profileInput("默认策略", editForm.default_strategy, pending, (default_strategy) =>
                      onEditFormChange({ ...editForm, default_strategy })
                    )
                  : profile.default_strategy}
              </TableCell>
              <TableCell>
                {editing
                  ? profileInput("配置档描述", editForm.description, pending, (description) =>
                      onEditFormChange({ ...editForm, description })
                    )
                  : profile.description ?? "-"}
              </TableCell>
              <TableCell>
                <StatusBadge enabled={profile.enabled} />
              </TableCell>
              <TableCell>{profile.updated_at}</TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function profileInput(label: string, value: string, pending: boolean, onChange: (value: string) => void) {
  return (
    <Input aria-label={label} disabled={pending} onChange={(event) => onChange(event.target.value)} type="text" value={value} />
  );
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
}: Pick<
  ProfilesTableProps,
  "onCancelEdit" | "onDelete" | "onManageRules" | "onSaveEdit" | "onStartEdit" | "onToggleEnabled" | "pending"
> & {
  editing: boolean;
  profile: ProfileDto;
}) {
  if (editing) {
    return (
      <ActionGroup>
        <Button disabled={pending} onClick={() => onSaveEdit(profile)} size="sm" type="button">
          保存
        </Button>
        <Button disabled={pending} onClick={onCancelEdit} size="sm" type="button" variant="outline">
          取消
        </Button>
      </ActionGroup>
    );
  }

  return (
    <ActionGroup>
      <Button disabled={pending} onClick={() => onToggleEnabled(profile)} size="sm" type="button" variant="outline">
        {profile.enabled ? "停用" : "启用"}
      </Button>
      <Button disabled={pending} onClick={() => onManageRules(profile)} size="sm" type="button" variant="outline">
        规则
      </Button>
      <Button disabled={pending} onClick={() => onStartEdit(profile)} size="sm" type="button" variant="outline">
        编辑
      </Button>
      <ConfirmButton
        disabled={pending}
        description="删除后绑定该配置档的订阅令牌将无法继续使用它生成规则。"
        onConfirm={() => onDelete(profile)}
        size="sm"
        title={`删除配置档「${profile.name}」？`}
        type="button"
      >
        删除
      </ConfirmButton>
    </ActionGroup>
  );
}

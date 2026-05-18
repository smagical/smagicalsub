import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProfileDto } from "@smagicalsub/shared";
import { cn } from "@/lib/utils";
import { ActionGroup } from "../../shared/ActionGroup";
import { ConfirmButton } from "../../shared/ConfirmButton";
import { FilterField } from "../../shared/FilterField";
import { StatusBadge } from "../../shared/StatusBadge";
import type { ProfileEditFormState } from "./types";

type ProfilesTableProps = {
  editForm: ProfileEditFormState;
  editingProfileId: string | null;
  pending: boolean;
  profiles: ProfileDto[];
  selectedProfileId: string | null;
  onCancelEdit: () => void;
  onDelete: (profile: ProfileDto) => void;
  onDuplicate: (profile: ProfileDto) => void;
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
  selectedProfileId,
  onCancelEdit,
  onDelete,
  onDuplicate,
  onEditFormChange,
  onManageRules,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled
}: ProfilesTableProps) {
  const editingProfile = profiles.find((profile) => profile.id === editingProfileId) ?? null;

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card/75 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/55">
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
              const selected = selectedProfileId === profile.id;

              return (
                <TableRow className={cn("hover:bg-muted/35", selected && "bg-chart-3/10 hover:bg-chart-3/10")} key={profile.id}>
                  <TableCell className="min-w-[180px]">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 truncate font-medium">{profile.name}</span>
                      {selected ? <Badge variant="secondary">规则面板</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[130px]">
                    <Badge className="font-mono" variant="outline">
                      {profile.default_strategy}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <span className="line-clamp-2 text-sm text-muted-foreground">{profile.description ?? "未填写描述"}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge enabled={profile.enabled} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{profile.updated_at}</TableCell>
                  <TableCell className="min-w-[300px]">
                    <ProfileActions
                      pending={pending}
                      profile={profile}
                      selected={selected}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      onManageRules={onManageRules}
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

      <ProfileEditDialog
        editForm={editForm}
        pending={pending}
        profile={editingProfile}
        onCancelEdit={onCancelEdit}
        onEditFormChange={onEditFormChange}
        onSaveEdit={onSaveEdit}
      />
    </>
  );
}

function ProfileActions({
  pending,
  profile,
  selected,
  onDelete,
  onDuplicate,
  onManageRules,
  onStartEdit,
  onToggleEnabled
}: Pick<
  ProfilesTableProps,
  "onDelete" | "onDuplicate" | "onManageRules" | "onStartEdit" | "onToggleEnabled" | "pending"
> & {
  profile: ProfileDto;
  selected: boolean;
}) {
  return (
    <ActionGroup className="flex-nowrap">
      <Button disabled={pending} onClick={() => onToggleEnabled(profile)} size="sm" type="button" variant={profile.enabled ? "warning" : "success"}>
        {profile.enabled ? "停用" : "启用"}
      </Button>
      <Button disabled={pending} onClick={() => onManageRules(profile)} size="sm" type="button" variant={selected ? "secondary" : "info"}>
        {selected ? "已选规则" : "规则"}
      </Button>
      <Button disabled={pending} onClick={() => onDuplicate(profile)} size="sm" type="button" variant="outline">
        复制
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

function ProfileEditDialog({
  editForm,
  pending,
  profile,
  onCancelEdit,
  onEditFormChange,
  onSaveEdit
}: {
  editForm: ProfileEditFormState;
  pending: boolean;
  profile: ProfileDto | null;
  onCancelEdit: () => void;
  onEditFormChange: (form: ProfileEditFormState) => void;
  onSaveEdit: (profile: ProfileDto) => void;
}) {
  return (
    <Dialog open={Boolean(profile)} onOpenChange={(open) => (!open ? onCancelEdit() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑配置档</DialogTitle>
          <DialogDescription>修改配置档名称、默认策略和描述，保存后会影响绑定该配置档的订阅输出。</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(160px,0.55fr)] gap-3 max-[560px]:grid-cols-1">
            <FilterField className="min-w-0" label="名称">
              <Input
                aria-label="配置档名称"
                disabled={pending}
                onChange={(event) => onEditFormChange({ ...editForm, name: event.target.value })}
                type="text"
                value={editForm.name}
              />
            </FilterField>
            <FilterField className="min-w-0" label="默认策略">
              <Input
                aria-label="默认策略"
                disabled={pending}
                onChange={(event) => onEditFormChange({ ...editForm, default_strategy: event.target.value })}
                type="text"
                value={editForm.default_strategy}
              />
            </FilterField>
          </div>
          <FilterField className="min-w-0" label="描述">
            <Input
              aria-label="配置档描述"
              disabled={pending}
              onChange={(event) => onEditFormChange({ ...editForm, description: event.target.value })}
              type="text"
              value={editForm.description}
            />
          </FilterField>
        </DialogBody>
        <DialogFooter>
          <Button disabled={pending} onClick={onCancelEdit} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending || !profile} onClick={() => (profile ? onSaveEdit(profile) : undefined)} type="button" variant="info">
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

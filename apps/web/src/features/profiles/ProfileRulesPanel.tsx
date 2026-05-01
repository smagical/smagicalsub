import { Separator } from "@/components/ui/separator";
import type { Dispatch, SetStateAction } from "react";
import type { ProfileDto, ProfileRuleDto } from "@smagicalsub/shared";
import { EmptyState } from "../../shared/EmptyState";
import { ProfileRuleForm } from "./ProfileRuleForm";
import { ProfileRulesTable } from "./ProfileRulesTable";
import type { ProfileRuleEditFormState, ProfileRuleFormState } from "./types";

type ProfileRulesPanelProps = {
  editForm: ProfileRuleEditFormState;
  editingRuleId: string | null;
  form: ProfileRuleFormState;
  pending: boolean;
  profile: ProfileDto;
  rules: ProfileRuleDto[];
  setForm: Dispatch<SetStateAction<ProfileRuleFormState>>;
  onCancelEdit: () => void;
  onCreateRule: (value: { rule: string; position?: number; enabled: boolean }) => void;
  onDeleteRule: (rule: ProfileRuleDto) => void;
  onEditFormChange: (form: ProfileRuleEditFormState) => void;
  onMoveRule: (rule: ProfileRuleDto, direction: "down" | "up") => void;
  onSaveEdit: (rule: ProfileRuleDto) => void;
  onStartEdit: (rule: ProfileRuleDto) => void;
  onToggleRule: (rule: ProfileRuleDto) => void;
};

export function ProfileRulesPanel({
  editForm,
  editingRuleId,
  form,
  pending,
  profile,
  rules,
  setForm,
  onCancelEdit,
  onCreateRule,
  onDeleteRule,
  onEditFormChange,
  onMoveRule,
  onSaveEdit,
  onStartEdit,
  onToggleRule
}: ProfileRulesPanelProps) {
  return (
    <section className="flex flex-col gap-4">
      <Separator />
      <div className="grid gap-1">
        <p className="text-xs font-semibold text-muted-foreground">Rules</p>
        <h3 className="text-base font-medium">{profile.name} 的规则</h3>
        <span className="text-sm text-muted-foreground">规则按排序升序写入 Clash；没有 MATCH 规则时会自动追加默认策略兜底。</span>
      </div>
      <ProfileRuleForm form={form} pending={pending} setForm={setForm} onSubmit={onCreateRule} />
      {rules.length === 0 ? (
        <EmptyState label="还没有配置档规则" />
      ) : (
        <ProfileRulesTable
          editForm={editForm}
          editingRuleId={editingRuleId}
          pending={pending}
          rules={rules}
          onCancelEdit={onCancelEdit}
          onDelete={onDeleteRule}
          onEditFormChange={onEditFormChange}
          onMove={onMoveRule}
          onSaveEdit={onSaveEdit}
          onStartEdit={onStartEdit}
          onToggleEnabled={onToggleRule}
        />
      )}
    </section>
  );
}

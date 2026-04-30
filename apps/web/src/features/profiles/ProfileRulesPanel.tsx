import type { Dispatch, SetStateAction } from "react";
import type { ProfileDto, ProfileRuleDto } from "@smagicalsub/shared";
import { EmptyState } from "../../shared/EmptyState";
import { ProfileRuleForm } from "./ProfileRuleForm";
import { ProfileRulesTable } from "./ProfileRulesTable";
import type { ProfileRuleFormState } from "./types";

type ProfileRulesPanelProps = {
  form: ProfileRuleFormState;
  pending: boolean;
  profile: ProfileDto;
  rules: ProfileRuleDto[];
  setForm: Dispatch<SetStateAction<ProfileRuleFormState>>;
  onCreateRule: (value: { rule: string; position?: number; enabled: boolean }) => void;
  onDeleteRule: (rule: ProfileRuleDto) => void;
  onToggleRule: (rule: ProfileRuleDto) => void;
};

export function ProfileRulesPanel({
  form,
  pending,
  profile,
  rules,
  setForm,
  onCreateRule,
  onDeleteRule,
  onToggleRule
}: ProfileRulesPanelProps) {
  return (
    <section className="sub-panel">
      <div className="module-heading">
        <p className="eyebrow">Rules</p>
        <h3>{profile.name} 的规则</h3>
        <span>规则按排序升序写入 Clash；没有 MATCH 规则时会自动追加默认策略兜底。</span>
      </div>
      <ProfileRuleForm form={form} pending={pending} setForm={setForm} onSubmit={onCreateRule} />
      {rules.length === 0 ? (
        <EmptyState label="还没有配置档规则" />
      ) : (
        <ProfileRulesTable pending={pending} rules={rules} onDelete={onDeleteRule} onToggleEnabled={onToggleRule} />
      )}
    </section>
  );
}

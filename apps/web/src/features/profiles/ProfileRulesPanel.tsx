import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Dispatch, SetStateAction } from "react";
import type { CreateProfileRuleInput, ProfileDto, ProfileRuleDto } from "@smagicalsub/shared";
import { ListChecks, Route, ShieldCheck } from "lucide-react";
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
  onApplyRulePreset: (rules: readonly string[]) => void;
  onCreateRule: (value: CreateProfileRuleInput) => void;
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
  onApplyRulePreset,
  onCreateRule,
  onDeleteRule,
  onEditFormChange,
  onMoveRule,
  onSaveEdit,
  onStartEdit,
  onToggleRule
}: ProfileRulesPanelProps) {
  const enabledRules = rules.filter((rule) => Boolean(rule.enabled)).length;
  const disabledRules = rules.length - enabledRules;

  return (
    <section className="flex flex-col gap-3" aria-label={`${profile.name}的规则面板`}>
      <Separator />
      <div className="grid gap-3 rounded-xl border bg-card/80 p-3 shadow-sm lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.15fr)]">
        <div className="grid gap-2">
          <Badge className="w-fit gap-1.5 border-chart-3/30 bg-chart-3/10 text-chart-3" variant="outline">
            <Route />
            规则编排
          </Badge>
          <div className="grid gap-1">
            <h3 className="text-base font-semibold leading-tight">{profile.name}的规则</h3>
            <p className="text-sm text-muted-foreground">按排序升序写入输出配置，适合把分流、直连和兜底策略集中维护。</p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <RuleMetric icon={ListChecks} label="规则总数" value={rules.length} />
          <RuleMetric icon={ShieldCheck} label="启用规则" value={enabledRules} />
          <RuleMetric icon={Route} label="停用规则" value={disabledRules} />
        </div>
      </div>

      <div className="grid gap-4 2xl:grid-cols-[minmax(620px,0.95fr)_minmax(520px,1.05fr)]">
        <Card className="min-w-0" size="sm">
          <CardHeader>
            <CardTitle>添加规则</CardTitle>
            <CardDescription>使用模板生成常见规则，也可以直接编辑完整规则内容。</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <ProfileRuleForm
              form={form}
              pending={pending}
              setForm={setForm}
              onApplyPreset={onApplyRulePreset}
              onSubmit={onCreateRule}
            />
          </CardContent>
        </Card>

        <Card className="min-w-0" size="sm">
          <CardHeader>
            <CardTitle>规则排序</CardTitle>
            <CardDescription>启停、排序和编辑都会影响该配置档的最终输出。</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
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
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function RuleMetric({ icon: Icon, label, value }: { icon: typeof ListChecks; label: string; value: number }) {
  return (
    <div className="flex min-h-20 items-center justify-between gap-3 rounded-lg border bg-background/70 p-3">
      <div className="grid gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <strong className="font-mono text-2xl leading-none">{value}</strong>
      </div>
      <span className="rounded-md border border-chart-3/20 bg-chart-3/10 p-2 text-chart-3">
        <Icon />
      </span>
    </div>
  );
}

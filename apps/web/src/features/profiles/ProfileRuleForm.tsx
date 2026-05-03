import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { CheckboxField } from "../../shared/CheckboxField";
import { FilterField } from "../../shared/FilterField";
import { FormGrid } from "../../shared/FormGrid";
import type { ProfileRuleFormState } from "./types";
import {
  buildProfileRule,
  parseProfileRule,
  profileRuleKinds,
  type ProfileRuleKind,
  type StructuredProfileRule,
  toCreateProfileRuleInput
} from "./utils";

type ProfileRuleFormProps = {
  form: ProfileRuleFormState;
  pending: boolean;
  setForm: Dispatch<SetStateAction<ProfileRuleFormState>>;
  onSubmit: (value: ReturnType<typeof toCreateProfileRuleInput>) => void;
};

const ruleTemplates = [
  { label: "域名后缀", sample: "example.com", value: "DOMAIN-SUFFIX,example.com,Proxy" },
  { label: "完整域名", sample: "example.com", value: "DOMAIN,example.com,Proxy" },
  { label: "关键词", sample: "google", value: "DOMAIN-KEYWORD,google,Proxy" },
  { label: "IP 段", sample: "8.8.8.8/32", value: "IP-CIDR,8.8.8.8/32,Proxy" },
  { label: "兜底", sample: "MATCH", value: "MATCH,Proxy" }
];

export function ProfileRuleForm({ form, pending, setForm, onSubmit }: ProfileRuleFormProps) {
  const structuredRule = parseProfileRule(form.rule);
  const ruleKind = profileRuleKinds.find((item) => item.value === structuredRule.kind) ?? profileRuleKinds[0];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(toCreateProfileRuleInput(form));
  }

  function updateRule(patch: Partial<StructuredProfileRule>) {
    setForm((current) => ({ ...current, rule: buildProfileRule({ ...structuredRule, ...patch }) }));
  }

  return (
    <div className="rounded-lg border bg-card/70 p-3 shadow-sm ring-1 ring-primary/10">
      <div className="mb-3 flex flex-col gap-2">
        <span className="text-xs font-semibold text-muted-foreground">常用模板</span>
        <div className="flex flex-wrap gap-2">
          {ruleTemplates.map((template) => (
            <Button
              className="h-auto justify-start gap-1.5 px-2 py-1"
              disabled={pending}
              key={template.label}
              onClick={() => setForm((current) => ({ ...current, rule: template.value }))}
              size="xs"
              title={template.value}
              type="button"
              variant="outline"
            >
              <span>{template.label}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{template.sample}</span>
            </Button>
          ))}
        </div>
      </div>
      <div className="mb-3 grid gap-3 lg:grid-cols-[minmax(140px,0.7fr)_minmax(220px,1.3fr)_minmax(160px,0.8fr)]">
        <FilterField label="规则类型">
          <NativeSelect
            disabled={pending}
            onChange={(event) => updateRule({ kind: event.target.value as ProfileRuleKind })}
            value={structuredRule.kind}
          >
            {profileRuleKinds.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
        {structuredRule.kind !== "MATCH" ? (
          <FilterField label="匹配值">
            <Input
              disabled={pending}
              onChange={(event) => updateRule({ target: event.target.value })}
              placeholder={ruleKind.placeholder}
              type="text"
              value={structuredRule.target}
            />
          </FilterField>
        ) : null}
        <FilterField label="策略">
          <Input
            disabled={pending}
            onChange={(event) => updateRule({ policy: event.target.value })}
            placeholder="Proxy"
            type="text"
            value={structuredRule.policy}
          />
        </FilterField>
      </div>
      <FormGrid className="mb-0" variant="rule" onSubmit={handleSubmit}>
        <FilterField label="规则">
          <Input
            onChange={(event) => setForm((current) => ({ ...current, rule: event.target.value }))}
            placeholder="DOMAIN-SUFFIX,example.com,Proxy"
            required
            type="text"
            value={form.rule}
          />
        </FilterField>
        <FilterField label="排序">
          <Input
            min={0}
            onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))}
            placeholder="自动"
            type="number"
            value={form.position}
          />
        </FilterField>
        <CheckboxField
          checked={form.enabled}
          label="启用"
          onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))}
        />
        <Button disabled={pending} type="submit">
          添加规则
        </Button>
      </FormGrid>
    </div>
  );
}

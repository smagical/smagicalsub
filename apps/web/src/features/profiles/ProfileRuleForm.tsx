import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { CheckboxField } from "../../shared/CheckboxField";
import { FilterField } from "../../shared/FilterField";
import { FormGrid } from "../../shared/FormGrid";
import type { ProfileRuleFormState } from "./types";
import { toCreateProfileRuleInput } from "./utils";

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
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(toCreateProfileRuleInput(form));
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

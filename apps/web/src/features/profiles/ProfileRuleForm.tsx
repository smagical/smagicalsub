import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { FilterField } from "../../shared/FilterField";
import type { ProfileRuleFormState } from "./types";
import { toCreateProfileRuleInput } from "./utils";

type ProfileRuleFormProps = {
  form: ProfileRuleFormState;
  pending: boolean;
  setForm: Dispatch<SetStateAction<ProfileRuleFormState>>;
  onSubmit: (value: ReturnType<typeof toCreateProfileRuleInput>) => void;
};

export function ProfileRuleForm({ form, pending, setForm, onSubmit }: ProfileRuleFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(toCreateProfileRuleInput(form));
  }

  return (
    <form className="form-grid rule-form" onSubmit={handleSubmit}>
      <FilterField className="wide-field" label="规则">
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
      <label className="checkbox-field">
        <input
          checked={form.enabled}
          onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
          type="checkbox"
        />
        <span>启用</span>
      </label>
      <Button disabled={pending} type="submit">
        添加规则
      </Button>
    </form>
  );
}

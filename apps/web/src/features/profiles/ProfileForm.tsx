import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { CheckboxField } from "../../shared/CheckboxField";
import { FilterField } from "../../shared/FilterField";
import type { ProfileFormState } from "./types";
import { toCreateProfileInput } from "./utils";

type ProfileFormProps = {
  form: ProfileFormState;
  pending: boolean;
  setForm: Dispatch<SetStateAction<ProfileFormState>>;
  onSubmit: (value: ReturnType<typeof toCreateProfileInput>) => void;
};

export function ProfileForm({ form, pending, setForm, onSubmit }: ProfileFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(toCreateProfileInput(form));
  }

  return (
    <form className="form-grid profile-form" onSubmit={handleSubmit}>
      <FilterField label="名称">
        <Input
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="默认配置"
          required
          type="text"
          value={form.name}
        />
      </FilterField>
      <FilterField label="默认策略">
        <Input
          onChange={(event) => setForm((current) => ({ ...current, default_strategy: event.target.value }))}
          placeholder="Proxy"
          required
          type="text"
          value={form.default_strategy}
        />
      </FilterField>
      <FilterField className="wide-field" label="描述">
        <Input
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="用于主力设备或备用线路"
          type="text"
          value={form.description}
        />
      </FilterField>
      <CheckboxField
        checked={form.enabled}
        label="启用"
        onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))}
      />
      <Button disabled={pending} type="submit">
        创建配置档
      </Button>
    </form>
  );
}

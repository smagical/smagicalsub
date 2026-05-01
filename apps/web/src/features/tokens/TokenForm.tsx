import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { ProfileDto } from "@smagicalsub/shared";
import { CheckboxField } from "../../shared/CheckboxField";
import { FilterField } from "../../shared/FilterField";
import { FormGrid } from "../../shared/FormGrid";
import type { TokenFormState } from "./types";
import { toCreateTokenInput } from "./utils";

type TokenFormProps = {
  form: TokenFormState;
  pending: boolean;
  profiles: ProfileDto[];
  setForm: Dispatch<SetStateAction<TokenFormState>>;
  onSubmit: (value: ReturnType<typeof toCreateTokenInput>) => void;
};

export function TokenForm({ form, pending, profiles, setForm, onSubmit }: TokenFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(toCreateTokenInput(form));
  }

  return (
    <FormGrid variant="token" onSubmit={handleSubmit}>
      <FilterField label="名称">
        <Input
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="默认订阅"
          required
          type="text"
          value={form.name}
        />
      </FilterField>
      <FilterField label="配置档">
        <NativeSelect
          onChange={(event) => setForm((current) => ({ ...current, profile_id: event.target.value }))}
          value={form.profile_id}
        >
          <option value="">不绑定</option>
          {profiles.map((profile) => (
            <option disabled={!profile.enabled} key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
        </NativeSelect>
      </FilterField>
      <FilterField label="过期时间">
        <Input
          onChange={(event) => setForm((current) => ({ ...current, expires_at: event.target.value }))}
          type="datetime-local"
          value={form.expires_at}
        />
      </FilterField>
      <CheckboxField
        checked={form.enabled}
        label="启用"
        onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))}
      />
      <Button disabled={pending} type="submit">
        创建令牌
      </Button>
    </FormGrid>
  );
}

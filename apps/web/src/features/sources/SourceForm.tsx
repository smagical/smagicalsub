import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { CheckboxField } from "../../shared/CheckboxField";
import { FilterField } from "../../shared/FilterField";
import { FormGrid } from "../../shared/FormGrid";
import type { SourceFormState } from "./types";

type SourceFormProps = {
  form: SourceFormState;
  pending: boolean;
  setForm: Dispatch<SetStateAction<SourceFormState>>;
  onSubmit: (value: SourceFormState) => void;
};

export function SourceForm({ form, pending, setForm, onSubmit }: SourceFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(form);
  }

  return (
    <FormGrid onSubmit={handleSubmit}>
      <FilterField label="名称">
        <Input
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="我的订阅"
          required
          type="text"
          value={form.name}
        />
      </FilterField>
      <FilterField label="订阅链接">
        <Input
          onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
          placeholder="https://example.com/sub"
          required
          type="url"
          value={form.url}
        />
      </FilterField>
      <CheckboxField
        checked={form.enabled}
        label="启用"
        onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))}
      />
      <Button disabled={pending} type="submit">
        创建
      </Button>
    </FormGrid>
  );
}

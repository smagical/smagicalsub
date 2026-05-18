import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { CheckboxField } from "../../shared/CheckboxField";
import { FilterField } from "../../shared/FilterField";
import { FormGrid } from "../../shared/FormGrid";
import { TagInput } from "../../shared/TagInput";
import type { NodeFormState } from "./types";

type NodeFormProps = {
  className?: string;
  form: NodeFormState;
  groups: string[];
  pending: boolean;
  setForm: Dispatch<SetStateAction<NodeFormState>>;
  onSubmit: (value: { uri: string; name?: string; groups: string[]; enabled: boolean }) => void;
};

export function NodeForm({ className, form, groups, pending, setForm, onSubmit }: NodeFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      uri: form.uri,
      name: form.name.trim() ? form.name : undefined,
      groups: form.groups,
      enabled: form.enabled
    });
  }

  return (
    <FormGrid className={className} variant="node" onSubmit={handleSubmit}>
      <FilterField className="min-w-0" label="节点链接">
        <Input
          className="truncate"
          onChange={(event) => setForm((current) => ({ ...current, uri: event.target.value }))}
          placeholder="ss:// / vmess:// / trojan:// / vless://"
          required
          type="text"
          value={form.uri}
        />
      </FilterField>
      <FilterField className="min-w-0" label="显示名称">
        <Input
          className="truncate"
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="留空使用节点名称"
          type="text"
          value={form.name}
        />
      </FilterField>
      <FilterField className="min-w-0" label="分组">
        <TagInput
          ariaLabel="节点分组"
          onChange={(groups) => setForm((current) => ({ ...current, groups }))}
          placeholder="回车添加分组"
          suggestions={groups}
          value={form.groups}
        />
      </FilterField>
      <CheckboxField
        checked={form.enabled}
        label="启用"
        onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))}
      />
      <Button className="self-end" disabled={pending} type="submit" variant="info">
        添加节点
      </Button>
    </FormGrid>
  );
}

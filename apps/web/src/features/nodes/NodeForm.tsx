import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { NodeFormState } from "./types";
import { parseGroups } from "./utils";

type NodeFormProps = {
  form: NodeFormState;
  pending: boolean;
  setForm: Dispatch<SetStateAction<NodeFormState>>;
  onSubmit: (value: { uri: string; name?: string; groups: string[]; enabled: boolean }) => void;
};

export function NodeForm({ form, pending, setForm, onSubmit }: NodeFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      uri: form.uri,
      name: form.name.trim() ? form.name : undefined,
      groups: parseGroups(form.groups),
      enabled: form.enabled
    });
  }

  return (
    <form className="form-grid node-form" onSubmit={handleSubmit}>
      <label className="wide-field">
        <span>节点链接</span>
        <Input
          onChange={(event) => setForm((current) => ({ ...current, uri: event.target.value }))}
          placeholder="ss:// / vmess:// / trojan:// / vless://"
          required
          type="text"
          value={form.uri}
        />
      </label>
      <label>
        <span>显示名称</span>
        <Input
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="留空使用节点名称"
          type="text"
          value={form.name}
        />
      </label>
      <label>
        <span>分组</span>
        <Input
          onChange={(event) => setForm((current) => ({ ...current, groups: event.target.value }))}
          placeholder="香港,日本,备用"
          type="text"
          value={form.groups}
        />
      </label>
      <label className="checkbox-field">
        <input
          checked={form.enabled}
          onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
          type="checkbox"
        />
        <span>启用</span>
      </label>
      <Button disabled={pending} type="submit">
        添加节点
      </Button>
    </form>
  );
}

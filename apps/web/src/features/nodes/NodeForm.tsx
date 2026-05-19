import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { ImportNodeResultDto, ImportNodesInput } from "@smagicalsub/shared";
import { CheckboxField } from "../../shared/CheckboxField";
import { FilterField } from "../../shared/FilterField";
import { TagInput } from "../../shared/TagInput";
import type { NodeFormState } from "./types";

type NodeFormProps = {
  className?: string;
  form: NodeFormState;
  groups: string[];
  importResult?: ImportNodeResultDto | null;
  pending: boolean;
  setForm: Dispatch<SetStateAction<NodeFormState>>;
  onImport: (value: ImportNodesInput) => void;
  onSubmit: (value: { uri: string; name?: string; groups: string[]; enabled: boolean }) => void;
};

export function NodeForm({ className, form, groups, importResult, pending, setForm, onImport, onSubmit }: NodeFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      uri: form.uri,
      name: form.name.trim() ? form.name : undefined,
      groups: form.groups,
      enabled: form.enabled
    });
  }

  function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const items = form.bulkUris
      .split(/\r?\n/)
      .map((line, index) => ({ line: index + 1, uri: line.trim() }))
      .filter((item) => item.uri);

    if (items.length === 0) {
      return;
    }

    onImport({
      items,
      groups: form.groups,
      enabled: form.enabled
    });
  }

  return (
    <div className={className}>
      <form className="grid gap-3 lg:grid-cols-[minmax(260px,1.4fr)_minmax(160px,0.7fr)_minmax(160px,0.7fr)_auto_auto]" onSubmit={handleSubmit}>
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
            maxLength={120}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="留空使用节点名称"
            type="text"
            value={form.name}
          />
        </FilterField>
        <SharedNodeOptions form={form} groups={groups} pending={pending} setForm={setForm} />
        <Button className="self-end" disabled={pending} type="submit" variant="info">
          添加节点
        </Button>
      </form>

      <form className="mt-4 grid gap-3 rounded-xl border bg-background/70 p-3" onSubmit={handleImport}>
        <div className="grid gap-1">
          <h4 className="text-sm font-semibold">批量导入</h4>
          <p className="text-xs leading-5 text-muted-foreground">
            每行一个节点链接，支持 ss、ssr、vmess、vless、trojan 等已支持协议；无效链接会按行号返回，节点名称超过 120 字符会自动截断。
          </p>
        </div>
        <FilterField className="min-w-0" label="节点链接列表">
          <Textarea
            className="min-h-32 font-mono text-xs leading-5"
            onChange={(event) => setForm((current) => ({ ...current, bulkUris: event.target.value }))}
            placeholder={"ss://...\nvmess://...\ntrojan://..."}
            value={form.bulkUris}
          />
        </FilterField>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            将使用上方分组和启用状态导入，空行会自动忽略。
          </p>
          <Button disabled={pending || form.bulkUris.trim().length === 0} type="submit" variant="outline">
            批量导入
          </Button>
        </div>
        {importResult ? (
          <div className="grid gap-2 rounded-lg border bg-card p-2.5 text-xs">
            <p className="font-medium">导入结果：成功 {importResult.created.length} 个，失败 {importResult.failed.length} 条。</p>
            {importResult.failed.length > 0 ? (
              <ul className="grid gap-1 text-muted-foreground">
                {importResult.failed.slice(0, 8).map((item) => (
                  <li key={`${item.line}-${item.value}`}>
                    第 {item.line} 行：{item.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </form>
    </div>
  );
}

function SharedNodeOptions({
  form,
  groups,
  pending,
  setForm
}: {
  form: NodeFormState;
  groups: string[];
  pending: boolean;
  setForm: Dispatch<SetStateAction<NodeFormState>>;
}) {
  return (
    <>
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
        disabled={pending}
        label="启用"
        onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))}
      />
    </>
  );
}

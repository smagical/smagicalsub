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
  const nodeItems = parseNodeInput(form.uri);
  const isBatch = nodeItems.length > 1;
  const canSubmit = nodeItems.length > 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (nodeItems.length === 0) {
      return;
    }

    if (nodeItems.length === 1) {
      onSubmit({
        uri: nodeItems[0].uri,
        name: form.name.trim() ? form.name : undefined,
        groups: form.groups,
        enabled: form.enabled
      });
      return;
    }

    onImport({ items: nodeItems, groups: form.groups, enabled: form.enabled });
  }

  return (
    <div className={className}>
      <form className="grid gap-3 rounded-xl border bg-background/70 p-3" onSubmit={handleSubmit}>
        <FilterField className="min-w-0" label="节点链接">
          <Textarea
            className="min-h-32 font-mono text-xs leading-5"
            onChange={(event) => setForm((current) => ({ ...current, uri: event.target.value }))}
            placeholder={"ss://...\nvmess://...\ntrojan://..."}
            required
            value={form.uri}
          />
        </FilterField>
        <div className="grid items-end gap-3 lg:grid-cols-[minmax(160px,0.8fr)_minmax(160px,0.8fr)_auto_auto]">
          <FilterField className="min-w-0" label="显示名称">
            <Input
              className="truncate"
              disabled={pending || isBatch}
              maxLength={120}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder={isBatch ? "多节点导入时忽略" : "留空使用节点名称"}
              type="text"
              value={isBatch ? "" : form.name}
            />
          </FilterField>
          <SharedNodeOptions form={form} groups={groups} pending={pending} setForm={setForm} />
          <Button className="self-end" disabled={pending || !canSubmit} type="submit" variant="info">
            {isBatch ? `导入 ${nodeItems.length} 个节点` : "添加节点"}
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {isBatch
              ? "检测到多行节点链接，显示名称会被忽略，导入后使用节点自身名称。"
              : "单条节点链接可填写显示名称；节点名称超过 120 字符会自动截断。"}
          </span>
          <span>
            支持 ss、ssr、vmess、vless、trojan 等已支持协议；空行会自动忽略。
          </span>
        </div>
        {importResult ? (
          <div className="grid gap-2 rounded-lg border bg-card p-2.5 text-xs">
            <p className="font-medium">
              导入结果：新增 {importResult.created.length} 个，去重 {importResult.deduped.length} 个，失败 {importResult.failed.length} 条。
            </p>
            {importResult.deduped.length > 0 ? (
              <div className="grid gap-1 text-muted-foreground">
                <span className="font-medium text-foreground">已去重节点</span>
                <p className="line-clamp-2">
                  {importResult.deduped.slice(0, 10).map((node) => node.name).join("、")}
                  {importResult.deduped.length > 10 ? ` 等 ${importResult.deduped.length} 个` : ""}
                </p>
              </div>
            ) : null}
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

function parseNodeInput(value: string): ImportNodesInput["items"] {
  return value
    .split(/\r?\n/)
    .map((line, index) => ({ line: index + 1, uri: line.trim() }))
    .filter((item) => item.uri);
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
        className="h-8 !min-h-8"
        disabled={pending}
        label="启用"
        onCheckedChange={(enabled) => setForm((current) => ({ ...current, enabled }))}
      />
    </>
  );
}

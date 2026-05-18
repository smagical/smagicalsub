import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ConfigParameterRow } from "./profileParameterUtils";
import { parameterRawValue, updateJsonContent } from "./profileParameterUtils";

type ConfigParameterValueEditorProps = {
  content: string;
  draft?: string;
  row: ConfigParameterRow;
  onChange: (content: string) => void;
  onDraftChange: (draft?: string) => void;
};

export function ProfileParameterValueEditor({ content, draft, row, onChange, onDraftChange }: ConfigParameterValueEditorProps) {
  if (row.kind === "boolean") {
    return (
      <label className="inline-flex min-h-8 items-center gap-2 rounded-md border bg-background/70 px-2 py-1">
        <Checkbox
          checked={Boolean(row.valueData)}
          onCheckedChange={(checked) => {
            const nextContent = updateJsonContent(content, row.pathSegments, checked === true);
            if (nextContent) {
              onDraftChange(undefined);
              onChange(nextContent);
            }
          }}
        />
        <span className="text-[11px] text-muted-foreground">{Boolean(row.valueData) ? "开启" : "关闭"}</span>
      </label>
    );
  }

  if (row.kind === "number") {
    const valueText = draft ?? (typeof row.valueData === "number" ? String(row.valueData) : "");

    return (
      <Input
        className="h-8 font-mono text-xs"
        inputMode="decimal"
        onChange={(event) => {
          const nextText = event.target.value;
          onDraftChange(nextText);

          if (nextText.trim() === "") {
            return;
          }

          const nextNumber = Number(nextText);
          if (Number.isFinite(nextNumber)) {
            const nextContent = updateJsonContent(content, row.pathSegments, nextNumber);
            if (nextContent) {
              onChange(nextContent);
            }
          }
        }}
        value={valueText}
      />
    );
  }

  if (row.kind === "array" || row.kind === "object") {
    const valueText = draft ?? parameterRawValue(row.valueData);

    return (
      <Textarea
        className="min-h-20 font-mono text-xs"
        onChange={(event) => {
          const nextText = event.target.value;
          onDraftChange(nextText);

          try {
            const parsed = JSON.parse(nextText) as unknown;
            const isValid = row.kind === "array"
              ? Array.isArray(parsed)
              : parsed && typeof parsed === "object" && !Array.isArray(parsed);
            if (isValid) {
              const nextContent = updateJsonContent(content, row.pathSegments, parsed);
              if (nextContent) {
                onChange(nextContent);
              }
            }
          } catch {
            // 保留用户正在输入的无效 JSON 草稿，修正后再同步到底层 JSON。
          }
        }}
        value={valueText}
      />
    );
  }

  const valueText = draft ?? (row.valueData === null ? "null" : row.valueData === undefined ? "" : String(row.valueData));

  return (
    <Input
      className="h-8 font-mono text-xs"
      onChange={(event) => {
        const nextText = event.target.value;
        onDraftChange(nextText);

        if (row.kind === "string" || row.kind === "unknown" || row.kind === "null") {
          const nextValue = row.kind === "null" && nextText.trim().toLowerCase() === "null" ? null : nextText;
          const nextContent = updateJsonContent(content, row.pathSegments, nextValue);
          if (nextContent) {
            onChange(nextContent);
          }
        }
      }}
      placeholder={row.kind === "null" ? "null" : undefined}
      value={valueText}
    />
  );
}

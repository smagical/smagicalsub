import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileRuleDto, ProfileRuleFormat } from "@smagicalsub/shared";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../../shared/StatusBadge";
import { ProfileRuleActions } from "./ProfileRuleActions";
import type { ProfileRuleEditFormState } from "./types";
import { profileRuleFormats } from "./utils";

type ProfileRulesTableProps = {
  editForm: ProfileRuleEditFormState;
  editingRuleId: string | null;
  pending: boolean;
  rules: ProfileRuleDto[];
  onCancelEdit: () => void;
  onDelete: (rule: ProfileRuleDto) => void;
  onEditFormChange: (form: ProfileRuleEditFormState) => void;
  onMove: (rule: ProfileRuleDto, direction: "down" | "up") => void;
  onSaveEdit: (rule: ProfileRuleDto) => void;
  onStartEdit: (rule: ProfileRuleDto) => void;
  onToggleEnabled: (rule: ProfileRuleDto) => void;
};

export function ProfileRulesTable({
  editForm,
  editingRuleId,
  pending,
  rules,
  onCancelEdit,
  onDelete,
  onEditFormChange,
  onMove,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled
}: ProfileRulesTableProps) {
  const enabledCount = rules.filter((rule) => Boolean(rule.enabled)).length;

  return (
    <div className="overflow-hidden rounded-xl border bg-card/80 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/35 px-3 py-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">规则列表</span>
          <span>启用 {enabledCount}</span>
          <span>停用 {rules.length - enabledCount}</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">position asc</span>
      </div>
      <Table className="min-w-[740px]">
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className="w-[84px]">排序</TableHead>
            <TableHead className="w-[128px]">格式</TableHead>
            <TableHead>规则</TableHead>
            <TableHead className="w-[92px]">状态</TableHead>
            <TableHead className="w-[260px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule, index) => {
            const editing = editingRuleId === rule.id;

            return (
              <TableRow className={cn("hover:bg-muted/35", editing && "bg-primary/5 hover:bg-primary/5")} key={rule.id}>
                <TableCell className="py-2">
                  {editing
                    ? editInput("规则排序", editForm.position, pending, (position) => onEditFormChange({ ...editForm, position }), "number")
                    : (
                      <span className="rounded-md border bg-background px-2 py-1 font-mono text-xs text-muted-foreground">#{rule.position}</span>
                    )}
                </TableCell>
                <TableCell className="py-2">
                  {editing ? (
                    <NativeSelect
                      aria-label="规则格式"
                      disabled={pending}
                      onChange={(event) => onEditFormChange({ ...editForm, format: event.target.value as ProfileRuleFormat })}
                      value={editForm.format}
                    >
                      {profileRuleFormats.map((format) => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </NativeSelect>
                  ) : (
                    <RuleFormatBadge format={rule.format} />
                  )}
                </TableCell>
                <TableCell className="min-w-[280px] whitespace-normal py-2">
                  {editing
                    ? ruleEditor(editForm, pending, onEditFormChange)
                    : (
                      <span className="block whitespace-normal break-all font-mono text-xs leading-5 text-foreground" title={rule.rule}>
                        {rule.rule}
                      </span>
                    )}
                </TableCell>
                <TableCell className="py-2">
                  <StatusBadge enabled={rule.enabled} />
                </TableCell>
                <TableCell className="py-2">
                  <ProfileRuleActions
                    editing={editing}
                    pending={pending}
                    rule={rule}
                    onCancelEdit={onCancelEdit}
                    onDelete={onDelete}
                    onMove={onMove}
                    onSaveEdit={onSaveEdit}
                    onStartEdit={onStartEdit}
                    onToggleEnabled={onToggleEnabled}
                    canMoveDown={index < rules.length - 1}
                    canMoveUp={index > 0}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function RuleFormatBadge({ format }: { format: ProfileRuleFormat }) {
  const item = profileRuleFormats.find((entry) => entry.value === format) ?? profileRuleFormats[0];

  return (
    <Badge className={cn("whitespace-nowrap", format === "common" && "border-chart-2/30 bg-chart-2/10 text-chart-2")} variant={format === "common" ? "outline" : "secondary"}>
      {item.label}
    </Badge>
  );
}

function ruleEditor(editForm: ProfileRuleEditFormState, pending: boolean, onEditFormChange: (form: ProfileRuleEditFormState) => void) {
  if (editForm.format === "sing-box" || editForm.format === "xray") {
    return editInput("JSON 规则内容", editForm.content, pending, (content) => {
      onEditFormChange({ ...editForm, content, rule: content.trim() });
    }, "text");
  }

  return editInput("规则内容", editForm.rule, pending, (rule) => onEditFormChange({ ...editForm, rule }), "text");
}

function editInput(label: string, value: string, pending: boolean, onChange: (value: string) => void, type: "number" | "text") {
  if (type === "text") {
    return (
      <Textarea
        aria-label={label}
        className="min-h-16 font-mono text-xs leading-5"
        disabled={pending}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    );
  }

  return (
    <Input
      aria-label={label}
      disabled={pending}
      min={0}
      onChange={(event) => onChange(event.target.value)}
      type={type}
      value={value}
    />
  );
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProfileRuleDto } from "@smagicalsub/shared";
import { ActionGroup } from "../../shared/ActionGroup";
import { ConfirmButton } from "../../shared/ConfirmButton";
import { StatusBadge } from "../../shared/StatusBadge";
import type { ProfileRuleEditFormState } from "./types";

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
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>排序</TableHead>
          <TableHead>规则</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map((rule, index) => {
          const editing = editingRuleId === rule.id;

          return (
            <TableRow key={rule.id}>
              <TableCell>
                {editing
                  ? editInput("规则排序", editForm.position, pending, (position) => onEditFormChange({ ...editForm, position }), "number")
                  : rule.position}
              </TableCell>
              <TableCell className="mono-cell truncate-cell">
                {editing
                  ? editInput("规则内容", editForm.rule, pending, (value) => onEditFormChange({ ...editForm, rule: value }), "text")
                  : rule.rule}
              </TableCell>
              <TableCell>
                <StatusBadge enabled={rule.enabled} />
              </TableCell>
              <TableCell>
                <RuleActions
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
  );
}

function editInput(label: string, value: string, pending: boolean, onChange: (value: string) => void, type: "number" | "text") {
  return (
    <Input
      aria-label={label}
      disabled={pending}
      min={type === "number" ? 0 : undefined}
      onChange={(event) => onChange(event.target.value)}
      type={type}
      value={value}
    />
  );
}

function RuleActions({
  canMoveDown,
  canMoveUp,
  editing,
  pending,
  rule,
  onCancelEdit,
  onDelete,
  onMove,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled
}: Pick<ProfileRulesTableProps, "onCancelEdit" | "onDelete" | "onMove" | "onSaveEdit" | "onStartEdit" | "onToggleEnabled" | "pending"> & {
  canMoveDown: boolean;
  canMoveUp: boolean;
  editing: boolean;
  rule: ProfileRuleDto;
}) {
  if (editing) {
    return (
      <ActionGroup>
        <Button disabled={pending} onClick={() => onSaveEdit(rule)} size="sm" type="button">
          保存
        </Button>
        <Button disabled={pending} onClick={onCancelEdit} size="sm" type="button" variant="outline">
          取消
        </Button>
      </ActionGroup>
    );
  }

  return (
    <ActionGroup>
      <Button disabled={pending || !canMoveUp} onClick={() => onMove(rule, "up")} size="sm" type="button" variant="ghost">
        上移
      </Button>
      <Button disabled={pending || !canMoveDown} onClick={() => onMove(rule, "down")} size="sm" type="button" variant="ghost">
        下移
      </Button>
      <Button disabled={pending} onClick={() => onToggleEnabled(rule)} size="sm" type="button" variant="outline">
        {rule.enabled ? "停用" : "启用"}
      </Button>
      <Button disabled={pending} onClick={() => onStartEdit(rule)} size="sm" type="button" variant="outline">
        编辑
      </Button>
      <ConfirmButton
        disabled={pending}
        description="删除后该规则会从配置档输出中移除。"
        onConfirm={() => onDelete(rule)}
        size="sm"
        title={`删除规则「${rule.rule}」？`}
        type="button"
      >
        删除
      </ConfirmButton>
    </ActionGroup>
  );
}

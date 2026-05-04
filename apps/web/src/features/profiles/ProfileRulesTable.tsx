import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProfileRuleDto } from "@smagicalsub/shared";
import { StatusBadge } from "../../shared/StatusBadge";
import { ProfileRuleActions } from "./ProfileRuleActions";
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
    <div className="overflow-hidden rounded-lg border bg-card/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
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
              <TableRow className="hover:bg-muted/35" key={rule.id}>
                <TableCell>
                  {editing
                    ? editInput("规则排序", editForm.position, pending, (position) => onEditFormChange({ ...editForm, position }), "number")
                    : (
                      <span className="font-mono text-xs text-muted-foreground">#{rule.position}</span>
                    )}
                </TableCell>
                <TableCell className="max-w-md truncate font-mono">
                  {editing
                    ? editInput("规则内容", editForm.rule, pending, (value) => onEditFormChange({ ...editForm, rule: value }), "text")
                    : rule.rule}
                </TableCell>
                <TableCell>
                  <StatusBadge enabled={rule.enabled} />
                </TableCell>
                <TableCell>
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

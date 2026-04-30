import type { ProfileRuleDto } from "@smagicalsub/shared";
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
    <table className="data-table compact-table">
      <thead>
        <tr>
          <th>排序</th>
          <th>规则</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {rules.map((rule, index) => {
          const editing = editingRuleId === rule.id;

          return (
            <tr key={rule.id}>
              <td>{editing ? editInput("规则排序", editForm.position, pending, (position) => onEditFormChange({ ...editForm, position }), "number") : rule.position}</td>
              <td className="mono-cell truncate-cell">
                {editing ? editInput("规则内容", editForm.rule, pending, (value) => onEditFormChange({ ...editForm, rule: value }), "text") : rule.rule}
              </td>
              <td>
                <StatusBadge enabled={rule.enabled} />
              </td>
              <td>
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
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function editInput(label: string, value: string, pending: boolean, onChange: (value: string) => void, type: "number" | "text") {
  return <input aria-label={label} disabled={pending} min={type === "number" ? 0 : undefined} onChange={(event) => onChange(event.target.value)} type={type} value={value} />;
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
      <div className="table-actions">
        <button className="primary-button" disabled={pending} onClick={() => onSaveEdit(rule)} type="button">保存</button>
        <button className="secondary-button" disabled={pending} onClick={onCancelEdit} type="button">取消</button>
      </div>
    );
  }

  return (
    <div className="table-actions">
      <button className="inline-button" disabled={pending || !canMoveUp} onClick={() => onMove(rule, "up")} type="button">上移</button>
      <button className="inline-button" disabled={pending || !canMoveDown} onClick={() => onMove(rule, "down")} type="button">下移</button>
      <button className="secondary-button" disabled={pending} onClick={() => onToggleEnabled(rule)} type="button">{rule.enabled ? "停用" : "启用"}</button>
      <button className="secondary-button" disabled={pending} onClick={() => onStartEdit(rule)} type="button">编辑</button>
      <button className="danger-button" disabled={pending} onClick={() => onDelete(rule)} type="button">删除</button>
    </div>
  );
}

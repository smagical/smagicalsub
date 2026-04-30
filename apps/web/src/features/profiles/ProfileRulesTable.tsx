import type { ProfileRuleDto } from "@smagicalsub/shared";
import { StatusBadge } from "../../shared/StatusBadge";

type ProfileRulesTableProps = {
  pending: boolean;
  rules: ProfileRuleDto[];
  onDelete: (rule: ProfileRuleDto) => void;
  onToggleEnabled: (rule: ProfileRuleDto) => void;
};

export function ProfileRulesTable({ pending, rules, onDelete, onToggleEnabled }: ProfileRulesTableProps) {
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
        {rules.map((rule) => (
          <tr key={rule.id}>
            <td>{rule.position}</td>
            <td className="mono-cell truncate-cell">{rule.rule}</td>
            <td>
              <StatusBadge enabled={rule.enabled} />
            </td>
            <td>
              <div className="table-actions">
                <button className="secondary-button" disabled={pending} onClick={() => onToggleEnabled(rule)} type="button">
                  {rule.enabled ? "停用" : "启用"}
                </button>
                <button className="danger-button" disabled={pending} onClick={() => onDelete(rule)} type="button">
                  删除
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

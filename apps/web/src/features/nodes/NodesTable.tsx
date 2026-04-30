import type { NodeDto } from "@smagicalsub/shared";
import { StatusBadge } from "../../shared/StatusBadge";

type NodesTableProps = {
  nodes: NodeDto[];
  pending: boolean;
  onDelete: (node: NodeDto) => void;
  onToggleEnabled: (node: NodeDto) => void;
};

export function NodesTable({ nodes, pending, onDelete, onToggleEnabled }: NodesTableProps) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>名称</th>
          <th>协议</th>
          <th>服务端</th>
          <th>端口</th>
          <th>分组</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {nodes.map((node) => (
          <tr key={node.id}>
            <td>{node.name}</td>
            <td>{node.protocol}</td>
            <td>{node.server ?? "-"}</td>
            <td>{node.port ?? "-"}</td>
            <td>
              <GroupChips groups={node.groups} />
            </td>
            <td>
              <StatusBadge enabled={node.enabled} />
            </td>
            <td>
              <div className="table-actions">
                <button className="secondary-button" disabled={pending} onClick={() => onToggleEnabled(node)} type="button">
                  {node.enabled ? "停用" : "启用"}
                </button>
                <button className="danger-button" disabled={pending} onClick={() => onDelete(node)} type="button">
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

function GroupChips({ groups }: { groups: string[] }) {
  if (groups.length === 0) {
    return <span className="muted-text">未分组</span>;
  }

  return (
    <div className="group-chip-row">
      {groups.map((group) => (
        <span className="group-chip" key={group}>
          {group}
        </span>
      ))}
    </div>
  );
}


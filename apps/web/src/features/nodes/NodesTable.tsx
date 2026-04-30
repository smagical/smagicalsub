import type { NodeDto } from "@smagicalsub/shared";
import { StatusBadge } from "../../shared/StatusBadge";
import type { NodeEditFormState } from "./types";

type NodesTableProps = {
  editForm: NodeEditFormState;
  editingNodeId: string | null;
  nodes: NodeDto[];
  pending: boolean;
  onCancelEdit: () => void;
  onDelete: (node: NodeDto) => void;
  onEditFormChange: (form: NodeEditFormState) => void;
  onSaveEdit: (node: NodeDto) => void;
  onStartEdit: (node: NodeDto) => void;
  onToggleEnabled: (node: NodeDto) => void;
};

type NodeActionProps = Pick<NodesTableProps, "onCancelEdit" | "onDelete" | "onSaveEdit" | "onStartEdit" | "onToggleEnabled" | "pending"> & {
  editing: boolean;
  node: NodeDto;
};

export function NodesTable({
  editForm,
  editingNodeId,
  nodes,
  pending,
  onCancelEdit,
  onDelete,
  onEditFormChange,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled
}: NodesTableProps) {
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
        {nodes.map((node) => {
          const editing = editingNodeId === node.id;

          return (
            <tr key={node.id}>
              <td>
                {editing ? (
                  <input
                    aria-label="节点名称"
                    disabled={pending}
                    onChange={(event) => onEditFormChange({ ...editForm, name: event.target.value })}
                    type="text"
                    value={editForm.name}
                  />
                ) : (
                  node.name
                )}
              </td>
              <td>{node.protocol}</td>
              <td>{node.server ?? "-"}</td>
              <td>{node.port ?? "-"}</td>
              <td>
                {editing ? (
                  <input
                    aria-label="节点分组"
                    disabled={pending}
                    onChange={(event) => onEditFormChange({ ...editForm, groups: event.target.value })}
                    placeholder="香港,日本,备用"
                    type="text"
                    value={editForm.groups}
                  />
                ) : (
                  <GroupChips groups={node.groups} />
                )}
              </td>
              <td>
                <StatusBadge enabled={node.enabled} />
              </td>
              <td>
                <NodeActions
                  editing={editing}
                  node={node}
                  pending={pending}
                  onCancelEdit={onCancelEdit}
                  onDelete={onDelete}
                  onSaveEdit={onSaveEdit}
                  onStartEdit={onStartEdit}
                  onToggleEnabled={onToggleEnabled}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function NodeActions({
  editing,
  node,
  pending,
  onCancelEdit,
  onDelete,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled
}: NodeActionProps) {
  if (editing) {
    return (
      <div className="table-actions">
        <button className="primary-button" disabled={pending} onClick={() => onSaveEdit(node)} type="button">
          保存
        </button>
        <button className="secondary-button" disabled={pending} onClick={onCancelEdit} type="button">
          取消
        </button>
      </div>
    );
  }

  return (
    <div className="table-actions">
      <button className="secondary-button" disabled={pending} onClick={() => onToggleEnabled(node)} type="button">
        {node.enabled ? "停用" : "启用"}
      </button>
      <button className="secondary-button" disabled={pending} onClick={() => onStartEdit(node)} type="button">
        编辑
      </button>
      <button className="danger-button" disabled={pending} onClick={() => onDelete(node)} type="button">
        删除
      </button>
    </div>
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

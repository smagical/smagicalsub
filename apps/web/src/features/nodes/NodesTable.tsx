import type { NodeDto } from "@smagicalsub/shared";
import { StatusBadge } from "../../shared/StatusBadge";
import type { NodeEditFormState } from "./types";

type NodesTableProps = {
  editForm: NodeEditFormState;
  editingNodeId: string | null;
  selectedNodeIds: string[];
  allVisibleSelected: boolean;
  nodes: NodeDto[];
  pending: boolean;
  onCancelEdit: () => void;
  onDelete: (node: NodeDto) => void;
  onEditFormChange: (form: NodeEditFormState) => void;
  onSaveEdit: (node: NodeDto) => void;
  onStartEdit: (node: NodeDto) => void;
  onToggleEnabled: (node: NodeDto) => void;
  onToggleSelected: (nodeId: string, checked: boolean) => void;
  onToggleVisible: (checked: boolean) => void;
};

type NodeActionProps = Pick<NodesTableProps, "onCancelEdit" | "onDelete" | "onSaveEdit" | "onStartEdit" | "onToggleEnabled" | "pending"> & {
  editing: boolean;
  node: NodeDto;
};

export function NodesTable({
  editForm,
  editingNodeId,
  selectedNodeIds,
  allVisibleSelected,
  nodes,
  pending,
  onCancelEdit,
  onDelete,
  onEditFormChange,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled,
  onToggleSelected,
  onToggleVisible
}: NodesTableProps) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>{selectionInput("选择当前列表节点", allVisibleSelected, pending || nodes.length === 0, onToggleVisible)}</th>
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
                {selectionInput(`选择节点 ${node.name}`, selectedNodeIds.includes(node.id), pending, (checked) => onToggleSelected(node.id, checked))}
              </td>
              <td>
                {editing ? textInput("节点名称", editForm.name, pending, (name) => onEditFormChange({ ...editForm, name })) : node.name}
              </td>
              <td>{node.protocol}</td>
              <td>{node.server ?? "-"}</td>
              <td>{node.port ?? "-"}</td>
              <td>
                {editing ? (
                  textInput("节点分组", editForm.groups, pending, (groups) => onEditFormChange({ ...editForm, groups }), "香港,日本,备用")
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

function selectionInput(label: string, checked: boolean, disabled: boolean, onChange: (checked: boolean) => void) {
  return <input aria-label={label} checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} type="checkbox" />;
}

function textInput(label: string, value: string, pending: boolean, onChange: (value: string) => void, placeholder?: string) {
  return <input aria-label={label} disabled={pending} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="text" value={value} />;
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

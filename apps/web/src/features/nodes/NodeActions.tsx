import type { NodeDto } from "@smagicalsub/shared";

type NodeActionsProps = {
  editing: boolean;
  node: NodeDto;
  pending: boolean;
  onCancelEdit: () => void;
  onDelete: (node: NodeDto) => void;
  onSaveEdit: (node: NodeDto) => void;
  onStartEdit: (node: NodeDto) => void;
  onToggleEnabled: (node: NodeDto) => void;
};

export function NodeActions({
  editing,
  node,
  pending,
  onCancelEdit,
  onDelete,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled
}: NodeActionsProps) {
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

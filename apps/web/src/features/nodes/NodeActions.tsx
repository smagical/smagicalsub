import type { NodeDto } from "@smagicalsub/shared";
import { Button } from "@/components/ui/button";

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
        <Button disabled={pending} onClick={() => onSaveEdit(node)} type="button">
          保存
        </Button>
        <Button disabled={pending} onClick={onCancelEdit} type="button" variant="outline">
          取消
        </Button>
      </div>
    );
  }

  return (
    <div className="table-actions">
      <Button disabled={pending} onClick={() => onToggleEnabled(node)} type="button" variant="outline">
        {node.enabled ? "停用" : "启用"}
      </Button>
      <Button disabled={pending} onClick={() => onStartEdit(node)} type="button" variant="outline">
        编辑
      </Button>
      <Button disabled={pending} onClick={() => onDelete(node)} type="button" variant="destructive">
        删除
      </Button>
    </div>
  );
}

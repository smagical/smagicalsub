import type { NodeDto } from "@smagicalsub/shared";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "../../shared/ConfirmButton";

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
        <Button disabled={pending} onClick={() => onSaveEdit(node)} size="sm" type="button">
          保存
        </Button>
        <Button disabled={pending} onClick={onCancelEdit} size="sm" type="button" variant="outline">
          取消
        </Button>
      </div>
    );
  }

  return (
    <div className="table-actions">
      <Button disabled={pending} onClick={() => onToggleEnabled(node)} size="sm" type="button" variant="outline">
        {node.enabled ? "停用" : "启用"}
      </Button>
      <Button disabled={pending} onClick={() => onStartEdit(node)} size="sm" type="button" variant="outline">
        编辑
      </Button>
      <ConfirmButton
        disabled={pending}
        description="删除后该节点不会再出现在任何订阅输出中。"
        onConfirm={() => onDelete(node)}
        size="sm"
        title={`删除节点「${node.name}」？`}
        type="button"
      >
        删除
      </ConfirmButton>
    </div>
  );
}

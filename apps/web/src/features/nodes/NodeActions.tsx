import type { NodeDto } from "@smagicalsub/shared";
import { Button } from "@/components/ui/button";
import { Copy, Pencil, Power, Trash2 } from "lucide-react";
import { ActionGroup } from "../../shared/ActionGroup";
import { ConfirmButton } from "../../shared/ConfirmButton";

type NodeActionsProps = {
  className?: string;
  node: NodeDto;
  pending: boolean;
  onCopy: () => Promise<void> | void;
  onDelete: (node: NodeDto) => void;
  onStartEdit: (node: NodeDto) => void;
  onToggleEnabled: (node: NodeDto) => void;
};

export function NodeActions({
  className,
  node,
  pending,
  onCopy,
  onDelete,
  onStartEdit,
  onToggleEnabled
}: NodeActionsProps) {
  const sourceOnly = !node.manual && (node.source_ids.length > 0 || Boolean(node.source_id));
  const deleteDescription = node.manual && (node.source_ids.length > 0 || Boolean(node.source_id))
    ? "该节点也来自订阅源，删除只会取消手动来源，订阅源仍包含时节点会保留。"
    : "删除后该节点不会再出现在任何订阅输出中。";

  return (
    <ActionGroup className={className}>
      <Button className="w-full" disabled={pending} onClick={() => onToggleEnabled(node)} size="sm" type="button" variant={node.enabled ? "warning" : "success"}>
        <Power data-icon="inline-start" />
        {node.enabled ? "停用" : "启用"}
      </Button>
      <Button className="w-full" disabled={pending} onClick={() => onStartEdit(node)} size="sm" type="button" variant="outline">
        <Pencil data-icon="inline-start" />
        编辑
      </Button>
      <Button className="w-full" disabled={pending} onClick={() => void onCopy()} size="sm" type="button" variant="info">
        <Copy data-icon="inline-start" />
        复制
      </Button>
      <ConfirmButton
        className="w-full"
        disabled={pending || sourceOnly}
        description={sourceOnly ? "订阅源节点不能在节点页直接删除，请删除订阅源或刷新来源。" : deleteDescription}
        onConfirm={() => onDelete(node)}
        size="sm"
        title={`删除节点「${node.name}」？`}
        type="button"
      >
        <Trash2 data-icon="inline-start" />
        删除
      </ConfirmButton>
    </ActionGroup>
  );
}

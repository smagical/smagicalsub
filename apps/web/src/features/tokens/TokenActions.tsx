import type { SubscribeTokenDto } from "@smagicalsub/shared";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type TokenActionsProps = {
  editing: boolean;
  pending: boolean;
  token: SubscribeTokenDto;
  onCancelEdit: () => void;
  onCopy: (token: SubscribeTokenDto) => void;
  onDelete: (token: SubscribeTokenDto) => void;
  onOpen: (token: SubscribeTokenDto) => void;
  onReset: (token: SubscribeTokenDto) => void;
  onSaveEdit: (token: SubscribeTokenDto) => void;
  onStartEdit: (token: SubscribeTokenDto) => void;
  onToggleEnabled: (token: SubscribeTokenDto) => void;
};

export function TokenActions({
  editing,
  pending,
  token,
  onCancelEdit,
  onCopy,
  onDelete,
  onOpen,
  onReset,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled
}: TokenActionsProps) {
  if (editing) {
    return (
      <div className="table-actions">
        {actionButton("保存", "default", pending, () => onSaveEdit(token))}
        {actionButton("取消", "outline", pending, onCancelEdit)}
      </div>
    );
  }

  return (
    <div className="table-actions">
      {actionButton("复制", "outline", pending, () => onCopy(token))}
      {actionButton("打开", "ghost", pending, () => onOpen(token))}
      {actionButton("编辑", "outline", pending, () => onStartEdit(token))}
      {actionButton(token.enabled ? "停用" : "启用", "outline", pending, () => onToggleEnabled(token))}
      {actionButton("重置", "outline", pending, () => onReset(token))}
      {actionButton("删除", "destructive", pending, () => onDelete(token))}
    </div>
  );
}

function actionButton(label: string, variant: ComponentProps<typeof Button>["variant"], pending: boolean, onClick: () => void) {
  return (
    <Button disabled={pending} onClick={onClick} size="sm" type="button" variant={variant}>
      {label}
    </Button>
  );
}

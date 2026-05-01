import type { SubscribeTokenDto } from "@smagicalsub/shared";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
import { ConfirmButton } from "../../shared/ConfirmButton";

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
      <ConfirmButton
        disabled={pending}
        description="重置后旧订阅地址会立即失效，需要重新复制给客户端。"
        onConfirm={() => onReset(token)}
        size="sm"
        title={`重置令牌「${token.name}」？`}
        type="button"
        variant="outline"
      >
        重置
      </ConfirmButton>
      <ConfirmButton
        disabled={pending}
        description="删除后使用该令牌的订阅访问会立即失效。"
        onConfirm={() => onDelete(token)}
        size="sm"
        title={`删除令牌「${token.name}」？`}
        type="button"
      >
        删除
      </ConfirmButton>
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

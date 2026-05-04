import type { SubscribeTokenDto } from "@smagicalsub/shared";
import { Button } from "@/components/ui/button";
import type { ComponentProps, ReactNode } from "react";
import { Check, Copy, ExternalLink, Pencil, Power, RotateCcw, Trash2, X } from "lucide-react";
import { ActionGroup } from "../../shared/ActionGroup";
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
      <ActionGroup className="gap-1">
        {actionButton("保存", "info", pending, () => onSaveEdit(token), <Check />)}
        {actionButton("取消", "outline", pending, onCancelEdit, <X />)}
      </ActionGroup>
    );
  }

  return (
    <ActionGroup className="gap-1">
      {actionButton("复制订阅", "info", pending, () => onCopy(token), <Copy />)}
      {actionButton("打开订阅", "ghost", pending, () => onOpen(token), <ExternalLink />)}
      {actionButton("编辑令牌", "outline", pending, () => onStartEdit(token), <Pencil />)}
      {actionButton(token.enabled ? "停用令牌" : "启用令牌", token.enabled ? "warning" : "success", pending, () => onToggleEnabled(token), <Power />)}
      <ConfirmButton
        aria-label="重置令牌"
        disabled={pending}
        description="重置后旧订阅地址会立即失效，需要重新复制给客户端。"
        onConfirm={() => onReset(token)}
        size="icon-sm"
        title={`重置令牌「${token.name}」？`}
        type="button"
        variant="outline"
      >
        <RotateCcw />
      </ConfirmButton>
      <ConfirmButton
        aria-label="删除令牌"
        disabled={pending}
        description="删除后使用该令牌的订阅访问会立即失效。"
        onConfirm={() => onDelete(token)}
        size="icon-sm"
        title={`删除令牌「${token.name}」？`}
        type="button"
      >
        <Trash2 />
      </ConfirmButton>
    </ActionGroup>
  );
}

function actionButton(label: string, variant: ComponentProps<typeof Button>["variant"], pending: boolean, onClick: () => void, icon: ReactNode) {
  return (
    <Button aria-label={label} disabled={pending} onClick={onClick} size="icon-sm" title={label} type="button" variant={variant}>
      {icon}
    </Button>
  );
}

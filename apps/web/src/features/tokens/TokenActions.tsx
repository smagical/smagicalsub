import type { SubscribeTokenDto } from "@smagicalsub/shared";

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
        {actionButton("保存", "primary-button", pending, () => onSaveEdit(token))}
        {actionButton("取消", "secondary-button", pending, onCancelEdit)}
      </div>
    );
  }

  return (
    <div className="table-actions">
      {actionButton("复制", "secondary-button", pending, () => onCopy(token))}
      {actionButton("打开", "inline-button", pending, () => onOpen(token))}
      {actionButton("编辑", "secondary-button", pending, () => onStartEdit(token))}
      {actionButton(token.enabled ? "停用" : "启用", "secondary-button", pending, () => onToggleEnabled(token))}
      {actionButton("重置", "secondary-button", pending, () => onReset(token))}
      {actionButton("删除", "danger-button", pending, () => onDelete(token))}
    </div>
  );
}

function actionButton(label: string, className: string, pending: boolean, onClick: () => void) {
  return (
    <button className={className} disabled={pending} onClick={onClick} type="button">
      {label}
    </button>
  );
}

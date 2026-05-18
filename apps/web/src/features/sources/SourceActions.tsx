import { Button } from "@/components/ui/button";
import type { SourceDto } from "@smagicalsub/shared";
import { ActionGroup } from "../../shared/ActionGroup";
import { ConfirmButton } from "../../shared/ConfirmButton";

type SourceActionsProps = {
  className?: string;
  compact?: boolean;
  pending: boolean;
  source: SourceDto;
  onDelete: (source: SourceDto) => void;
  onRefresh: (id: string) => void;
  onStartEdit: (source: SourceDto) => void;
  onToggleEnabled: (source: SourceDto) => void;
};

export function SourceActions(props: SourceActionsProps) {
  const size = props.compact ? "xs" : "sm";

  return (
    <ActionGroup className={props.className}>
      <Button className="w-full" disabled={props.pending} onClick={() => props.onRefresh(props.source.id)} size={size} type="button" variant="info">
        刷新
      </Button>
      <Button className="w-full" disabled={props.pending} onClick={() => props.onStartEdit(props.source)} size={size} type="button" variant="outline">
        编辑
      </Button>
      <Button
        className="w-full"
        disabled={props.pending}
        onClick={() => props.onToggleEnabled(props.source)}
        size={size}
        type="button"
        variant={props.source.enabled ? "warning" : "success"}
      >
        {props.source.enabled ? "停用" : "启用"}
      </Button>
      <ConfirmButton
        className="w-full"
        disabled={props.pending}
        description="删除后该订阅源及其同步节点会从管理列表移除。"
        onConfirm={() => props.onDelete(props.source)}
        size={size}
        title={`删除订阅源「${props.source.name}」？`}
        type="button"
      >
        删除
      </ConfirmButton>
    </ActionGroup>
  );
}

import { Button } from "@/components/ui/button";
import type { SourceDto } from "@smagicalsub/shared";
import { ActionGroup } from "../../shared/ActionGroup";
import { ConfirmButton } from "../../shared/ConfirmButton";

type SourceActionsProps = {
  editing: boolean;
  pending: boolean;
  source: SourceDto;
  onCancelEdit: () => void;
  onDelete: (source: SourceDto) => void;
  onRefresh: (id: string) => void;
  onSaveEdit: (source: SourceDto) => void;
  onStartEdit: (source: SourceDto) => void;
  onToggleEnabled: (source: SourceDto) => void;
};

export function SourceActions(props: SourceActionsProps) {
  if (props.editing) {
    return (
      <ActionGroup>
        <Button disabled={props.pending} onClick={() => props.onSaveEdit(props.source)} size="sm" type="button">
          保存
        </Button>
        <Button disabled={props.pending} onClick={props.onCancelEdit} size="sm" type="button" variant="outline">
          取消
        </Button>
      </ActionGroup>
    );
  }

  return (
    <ActionGroup>
      <Button disabled={props.pending} onClick={() => props.onRefresh(props.source.id)} size="sm" type="button" variant="ghost">
        刷新
      </Button>
      <Button disabled={props.pending} onClick={() => props.onStartEdit(props.source)} size="sm" type="button" variant="outline">
        编辑
      </Button>
      <Button disabled={props.pending} onClick={() => props.onToggleEnabled(props.source)} size="sm" type="button" variant="outline">
        {props.source.enabled ? "停用" : "启用"}
      </Button>
      <ConfirmButton
        disabled={props.pending}
        description="删除后该订阅源及其同步节点会从管理列表移除。"
        onConfirm={() => props.onDelete(props.source)}
        size="sm"
        title={`删除订阅源「${props.source.name}」？`}
        type="button"
      >
        删除
      </ConfirmButton>
    </ActionGroup>
  );
}

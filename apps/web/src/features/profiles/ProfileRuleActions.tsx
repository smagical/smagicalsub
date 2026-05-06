import { Button } from "@/components/ui/button";
import type { ProfileRuleDto } from "@smagicalsub/shared";
import { ActionGroup } from "../../shared/ActionGroup";
import { ConfirmButton } from "../../shared/ConfirmButton";

type ProfileRuleActionsProps = {
  canMoveDown: boolean;
  canMoveUp: boolean;
  editing: boolean;
  pending: boolean;
  rule: ProfileRuleDto;
  onCancelEdit: () => void;
  onDelete: (rule: ProfileRuleDto) => void;
  onMove: (rule: ProfileRuleDto, direction: "down" | "up") => void;
  onSaveEdit: (rule: ProfileRuleDto) => void;
  onStartEdit: (rule: ProfileRuleDto) => void;
  onToggleEnabled: (rule: ProfileRuleDto) => void;
};

export function ProfileRuleActions(props: ProfileRuleActionsProps) {
  if (props.editing) {
    return (
      <ActionGroup className="grid grid-cols-2 gap-1">
        <Button disabled={props.pending} onClick={() => props.onSaveEdit(props.rule)} size="xs" type="button" variant="info">
          保存
        </Button>
        <Button disabled={props.pending} onClick={props.onCancelEdit} size="xs" type="button" variant="outline">
          取消
        </Button>
      </ActionGroup>
    );
  }

  return (
    <ActionGroup className="grid grid-cols-5 gap-1">
      <Button disabled={props.pending || !props.canMoveUp} onClick={() => props.onMove(props.rule, "up")} size="xs" type="button" variant="outline">
        上移
      </Button>
      <Button disabled={props.pending || !props.canMoveDown} onClick={() => props.onMove(props.rule, "down")} size="xs" type="button" variant="outline">
        下移
      </Button>
      <Button disabled={props.pending} onClick={() => props.onToggleEnabled(props.rule)} size="xs" type="button" variant={props.rule.enabled ? "warning" : "success"}>
        {props.rule.enabled ? "停用" : "启用"}
      </Button>
      <Button disabled={props.pending} onClick={() => props.onStartEdit(props.rule)} size="xs" type="button" variant="outline">
        编辑
      </Button>
      <ConfirmButton
        disabled={props.pending}
        description="删除后该规则会从配置档输出中移除。"
        onConfirm={() => props.onDelete(props.rule)}
        size="xs"
        title={`删除规则「${props.rule.rule}」？`}
        type="button"
      >
        删除
      </ConfirmButton>
    </ActionGroup>
  );
}

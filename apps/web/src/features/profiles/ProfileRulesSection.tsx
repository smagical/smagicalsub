import { useState } from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import type { ProfileDto, ProfileRuleDto } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageFeedback } from "../../shared/PageFeedback";
import { createProfileRule, deleteProfileRule, listProfileRules, updateProfileRule } from "./api";
import { ProfileRulesPanel } from "./ProfileRulesPanel";
import { initialProfileRuleEditFormState, initialProfileRuleFormState } from "./types";

type ProfileRulesSectionProps = {
  onClose: () => void;
  parentPending: boolean;
  profile: ProfileDto | null;
  setNotice: (message: string) => void;
};

export function ProfileRulesSection({ onClose, parentPending, profile, setNotice }: ProfileRulesSectionProps) {
  const queryClient = useQueryClient();
  const [ruleForm, setRuleForm] = useState(initialProfileRuleFormState);
  const [editForm, setEditForm] = useState(initialProfileRuleEditFormState);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const rulesQuery = useQuery({
    queryKey: ["profile-rules", profile?.id],
    queryFn: () => listProfileRules(profile?.id ?? ""),
    enabled: Boolean(profile),
    retry: false
  });
  const rules = rulesQuery.data?.items ?? [];

  const invalidateRuleData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["profile-rules", profile?.id] }),
      queryClient.invalidateQueries({ queryKey: ["tokens"] })
    ]);
  };

  const createRuleMutation = useMutation({
    mutationFn: (value: { rule: string; position?: number; enabled: boolean }) => createProfileRule(profile?.id ?? "", value),
    onSuccess: async () => {
      setRuleForm(initialProfileRuleFormState);
      setNotice("规则已添加");
      await invalidateRuleData();
    }
  });

  const applyRulePresetMutation = useMutation({
    mutationFn: async (presetRules: readonly string[]) => {
      const existingRules = new Set(rules.map((rule) => rule.rule.trim()));
      const newRules = presetRules.map((rule) => rule.trim()).filter((rule) => rule && !existingRules.has(rule));
      const startPosition = Math.max(-10, ...rules.map((rule) => rule.position)) + 10;

      for (const [index, rule] of newRules.entries()) {
        await createProfileRule(profile?.id ?? "", {
          enabled: true,
          position: startPosition + index * 10,
          rule
        });
      }

      return newRules.length;
    },
    onSuccess: async (createdCount) => {
      setNotice(createdCount > 0 ? `已应用 ${createdCount} 条模板规则` : "模板规则已存在");
      await invalidateRuleData();
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ ruleId, input }: { ruleId: string; input: Parameters<typeof updateProfileRule>[2] }) =>
      updateProfileRule(profile?.id ?? "", ruleId, input),
    onSuccess: async (_rule, variables) => {
      if (variables.input.rule !== undefined || variables.input.position !== undefined) {
        setEditingRuleId(null);
        setEditForm(initialProfileRuleEditFormState);
        setNotice("规则已更新");
      }

      await invalidateRuleData();
    }
  });

  const reorderRuleMutation = useMutation({
    mutationFn: async ({ from, to }: { from: ProfileRuleDto; to: ProfileRuleDto }) => {
      await updateProfileRule(profile?.id ?? "", from.id, { position: to.position });
      await updateProfileRule(profile?.id ?? "", to.id, { position: from.position });
    },
    onSuccess: async () => {
      setNotice("规则顺序已更新");
      await invalidateRuleData();
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => deleteProfileRule(profile?.id ?? "", ruleId),
    onSuccess: async () => {
      setNotice("规则已删除");
      await invalidateRuleData();
    }
  });

  const pending =
    parentPending ||
    createRuleMutation.isPending ||
    applyRulePresetMutation.isPending ||
    updateRuleMutation.isPending ||
    reorderRuleMutation.isPending ||
    deleteRuleMutation.isPending;
  const error =
    createRuleMutation.error ??
    applyRulePresetMutation.error ??
    updateRuleMutation.error ??
    reorderRuleMutation.error ??
    deleteRuleMutation.error ??
    rulesQuery.error;

  function closeRulesDialog() {
    setEditingRuleId(null);
    setEditForm(initialProfileRuleEditFormState);
    onClose();
  }

  function startEdit(rule: ProfileRuleDto) {
    setEditingRuleId(rule.id);
    setEditForm({ rule: rule.rule, position: String(rule.position) });
  }

  function saveEdit(rule: ProfileRuleDto) {
    updateRuleMutation.mutate({
      ruleId: rule.id,
      input: {
        rule: editForm.rule.trim() || rule.rule,
        position: Number(editForm.position.trim() || rule.position)
      }
    });
  }

  return (
    <Dialog open={Boolean(profile)} onOpenChange={(open) => (!open ? closeRulesDialog() : undefined)}>
      {profile ? (
        <DialogContent className="w-[min(96vw,1180px)] max-h-[92dvh] gap-3 p-4">
          <DialogHeader>
            <DialogTitle>规则编排</DialogTitle>
            <DialogDescription>正在维护「{profile.name}」的分流规则，添加、排序和编辑都在弹窗内完成。</DialogDescription>
          </DialogHeader>
          <DialogBody className="max-h-[calc(92dvh-132px)] gap-3 border-0 bg-transparent p-0 shadow-none">
            <PageFeedback error={error} />
            <ProfileRulesPanel
              form={ruleForm}
              editForm={editForm}
              editingRuleId={editingRuleId}
              pending={pending}
              profile={profile}
              rules={rules}
              setForm={setRuleForm}
              onApplyRulePreset={(presetRules) => applyRulePresetMutation.mutate(presetRules)}
              onCreateRule={(value) => createRuleMutation.mutate(value)}
              onDeleteRule={(rule) => deleteRuleMutation.mutate(rule.id)}
              onCancelEdit={() => {
                setEditingRuleId(null);
                setEditForm(initialProfileRuleEditFormState);
              }}
              onEditFormChange={setEditForm}
              onMoveRule={(rule, direction) => moveRule(rule, direction)}
              onSaveEdit={saveEdit}
              onStartEdit={startEdit}
              onToggleRule={(rule) => updateRuleMutation.mutate({ ruleId: rule.id, input: { enabled: !rule.enabled } })}
            />
          </DialogBody>
        </DialogContent>
      ) : null}
    </Dialog>
  );

  function moveRule(rule: ProfileRuleDto, direction: "down" | "up") {
    const index = rules.findIndex((item) => item.id === rule.id);
    const target = rules[direction === "up" ? index - 1 : index + 1];

    if (target) {
      reorderRuleMutation.mutate({ from: rule, to: target });
    }
  }
}

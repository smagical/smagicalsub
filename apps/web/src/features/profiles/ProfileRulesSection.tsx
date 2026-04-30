import { useState } from "react";
import type { ProfileDto, ProfileRuleDto } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProfileRule, deleteProfileRule, listProfileRules, updateProfileRule } from "./api";
import { ProfileRulesPanel } from "./ProfileRulesPanel";
import { initialProfileRuleEditFormState, initialProfileRuleFormState } from "./types";

type ProfileRulesSectionProps = {
  parentPending: boolean;
  profile: ProfileDto | null;
  setNotice: (message: string) => void;
};

export function ProfileRulesSection({ parentPending, profile, setNotice }: ProfileRulesSectionProps) {
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

  if (!profile) {
    return null;
  }

  const pending =
    parentPending || createRuleMutation.isPending || updateRuleMutation.isPending || reorderRuleMutation.isPending || deleteRuleMutation.isPending;
  const error = createRuleMutation.error ?? updateRuleMutation.error ?? reorderRuleMutation.error ?? deleteRuleMutation.error ?? rulesQuery.error;

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
    <>
      {error instanceof Error ? <p className="error-text">{error.message}</p> : null}
      <ProfileRulesPanel
        form={ruleForm}
        editForm={editForm}
        editingRuleId={editingRuleId}
        pending={pending}
        profile={profile}
        rules={rules}
        setForm={setRuleForm}
        onCreateRule={(value) => createRuleMutation.mutate(value)}
        onDeleteRule={(rule) => {
          if (window.confirm(`删除规则「${rule.rule}」？`)) {
            deleteRuleMutation.mutate(rule.id);
          }
        }}
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
    </>
  );

  function moveRule(rule: ProfileRuleDto, direction: "down" | "up") {
    const index = rules.findIndex((item) => item.id === rule.id);
    const target = rules[direction === "up" ? index - 1 : index + 1];

    if (target) {
      reorderRuleMutation.mutate({ from: rule, to: target });
    }
  }
}

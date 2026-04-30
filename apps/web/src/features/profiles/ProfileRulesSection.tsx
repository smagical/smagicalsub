import { useState } from "react";
import type { ProfileDto } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProfileRule, deleteProfileRule, listProfileRules, updateProfileRule } from "./api";
import { ProfileRulesPanel } from "./ProfileRulesPanel";
import { initialProfileRuleFormState } from "./types";

type ProfileRulesSectionProps = {
  parentPending: boolean;
  profile: ProfileDto | null;
  setNotice: (message: string) => void;
};

export function ProfileRulesSection({ parentPending, profile, setNotice }: ProfileRulesSectionProps) {
  const queryClient = useQueryClient();
  const [ruleForm, setRuleForm] = useState(initialProfileRuleFormState);
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
    mutationFn: ({ ruleId, enabled }: { ruleId: string; enabled: boolean }) =>
      updateProfileRule(profile?.id ?? "", ruleId, { enabled }),
    onSuccess: invalidateRuleData
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
    parentPending || createRuleMutation.isPending || updateRuleMutation.isPending || deleteRuleMutation.isPending;
  const error = createRuleMutation.error ?? updateRuleMutation.error ?? deleteRuleMutation.error ?? rulesQuery.error;

  return (
    <>
      {error instanceof Error ? <p className="error-text">{error.message}</p> : null}
      <ProfileRulesPanel
        form={ruleForm}
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
        onToggleRule={(rule) => updateRuleMutation.mutate({ ruleId: rule.id, enabled: !rule.enabled })}
      />
    </>
  );
}

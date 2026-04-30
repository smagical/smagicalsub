import { useState } from "react";
import type { ProfileDto } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleHeading } from "../../shared/ModuleHeading";
import { createProfile, deleteProfile, listProfiles, updateProfile } from "./api";
import { ProfileForm } from "./ProfileForm";
import { ProfileRulesSection } from "./ProfileRulesSection";
import { ProfilesTable } from "./ProfilesTable";
import { initialProfileFormState } from "./types";

export function ProfilesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialProfileFormState);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileDto | null>(null);
  const query = useQuery({
    queryKey: ["profiles"],
    queryFn: listProfiles,
    retry: false
  });
  const profiles = query.data?.items ?? [];

  const invalidateProfileData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["profiles"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createProfile,
    onSuccess: async () => {
      setForm(initialProfileFormState);
      setNotice("配置档已创建");
      await invalidateProfileData();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => updateProfile(id, { enabled }),
    onSuccess: invalidateProfileData
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: async () => {
      setSelectedProfile(null);
      setNotice("配置档已删除");
      await invalidateProfileData();
    }
  });

  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const error = createMutation.error ?? updateMutation.error ?? deleteMutation.error ?? query.error;

  return (
    <section className="panel wide">
      <ModuleHeading eyebrow="Profiles" title="配置档" description="维护订阅配置档，后续规则和令牌绑定会基于这里扩展。" />

      <ProfileForm form={form} pending={pending} setForm={setForm} onSubmit={(value) => createMutation.mutate(value)} />

      {notice ? <p className="success-text">{notice}</p> : null}
      {error instanceof Error ? <p className="error-text">{error.message}</p> : null}

      {profiles.length === 0 ? (
        <EmptyState label="还没有配置档" />
      ) : (
        <ProfilesTable
          pending={pending}
          profiles={profiles}
          onDelete={(profile) => {
            if (window.confirm(`删除配置档「${profile.name}」？`)) {
              deleteMutation.mutate(profile.id);
            }
          }}
          onManageRules={setSelectedProfile}
          onToggleEnabled={(profile) => updateMutation.mutate({ id: profile.id, enabled: !profile.enabled })}
        />
      )}

      <ProfileRulesSection
        parentPending={pending}
        profile={selectedProfile}
        setNotice={(message) => setNotice(message)}
      />
    </section>
  );
}

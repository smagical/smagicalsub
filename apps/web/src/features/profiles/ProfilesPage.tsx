import { useMemo, useState } from "react";
import type { ProfileDto, UpdateProfileInput } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleHeading } from "../../shared/ModuleHeading";
import { createProfile, deleteProfile, listProfiles, updateProfile } from "./api";
import { ProfileForm } from "./ProfileForm";
import { ProfileRulesSection } from "./ProfileRulesSection";
import { ProfilesTable } from "./ProfilesTable";
import { initialProfileEditFormState, initialProfileFormState } from "./types";

export function ProfilesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialProfileFormState);
  const [editForm, setEditForm] = useState(initialProfileEditFormState);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileDto | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const query = useQuery({
    queryKey: ["profiles"],
    queryFn: listProfiles,
    retry: false
  });
  const profiles = query.data?.items ?? [];
  const filteredProfiles = useMemo(
    () => profiles.filter((profile) => matchesProfileStatus(profile, statusFilter) && matchesProfileSearch(profile, searchQuery)),
    [profiles, searchQuery, statusFilter]
  );

  const invalidateProfileData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["profiles"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["tokens"] })
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
    mutationFn: ({ id, input }: { id: string; input: UpdateProfileInput }) => updateProfile(id, input),
    onSuccess: async (profile, variables) => {
      if (selectedProfile?.id === profile.id) {
        setSelectedProfile(profile);
      }

      if (variables.input.name !== undefined || variables.input.default_strategy !== undefined || variables.input.description !== undefined) {
        setEditingProfileId(null);
        setEditForm(initialProfileEditFormState);
        setNotice("配置档已更新");
      }

      await invalidateProfileData();
    }
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
  const emptyLabel = profiles.length === 0 ? "还没有配置档" : "没有匹配的配置档";

  function startEdit(profile: ProfileDto) {
    setNotice(null);
    setEditingProfileId(profile.id);
    setEditForm({ name: profile.name, description: profile.description ?? "", default_strategy: profile.default_strategy });
  }

  function saveEdit(profile: ProfileDto) {
    updateMutation.mutate({
      id: profile.id,
      input: {
        name: editForm.name.trim() || profile.name,
        default_strategy: editForm.default_strategy.trim() || profile.default_strategy,
        description: editForm.description.trim() || null
      }
    });
  }

  return (
    <section className="panel wide">
      <ModuleHeading eyebrow="Profiles" title="配置档" description="维护订阅配置档，后续规则和令牌绑定会基于这里扩展。" />

      <ProfileForm form={form} pending={pending} setForm={setForm} onSubmit={(value) => createMutation.mutate(value)} />
      <div className="filter-row">
        <label>
          <span>搜索配置档</span>
          <input
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="名称 / 策略 / 描述"
            type="search"
            value={searchQuery}
          />
        </label>
        <label>
          <span>状态筛选</span>
          <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option value="all">全部配置档</option>
            <option value="enabled">已启用</option>
            <option value="disabled">已停用</option>
          </select>
        </label>
      </div>

      {notice ? <p className="success-text">{notice}</p> : null}
      {error instanceof Error ? <p className="error-text">{error.message}</p> : null}

      {filteredProfiles.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <ProfilesTable
          editForm={editForm}
          editingProfileId={editingProfileId}
          pending={pending}
          profiles={filteredProfiles}
          onCancelEdit={() => {
            setEditingProfileId(null);
            setEditForm(initialProfileEditFormState);
          }}
          onDelete={(profile) => {
            if (window.confirm(`删除配置档「${profile.name}」？`)) {
              deleteMutation.mutate(profile.id);
            }
          }}
          onEditFormChange={setEditForm}
          onManageRules={setSelectedProfile}
          onSaveEdit={saveEdit}
          onStartEdit={startEdit}
          onToggleEnabled={(profile) => updateMutation.mutate({ id: profile.id, input: { enabled: !profile.enabled } })}
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

function matchesProfileStatus(profile: ProfileDto, statusFilter: string) {
  if (statusFilter === "enabled") {
    return profile.enabled === 1;
  }

  if (statusFilter === "disabled") {
    return profile.enabled !== 1;
  }

  return true;
}

function matchesProfileSearch(profile: ProfileDto, searchQuery: string) {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [profile.name, profile.default_strategy, profile.description ?? "", profile.updated_at].some((value) =>
    value.toLowerCase().includes(query)
  );
}

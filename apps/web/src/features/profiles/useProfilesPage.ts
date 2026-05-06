import { useMemo, useState } from "react";
import type { ProfileDto, UpdateProfileInput } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProfile, deleteProfile, listProfiles, updateProfile } from "./api";
import { initialProfileEditFormState, initialProfileFormState } from "./types";
import { filterProfiles } from "./utils";

export function useProfilesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialProfileFormState);
  const [editForm, setEditForm] = useState(initialProfileEditFormState);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileDto | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const query = useQuery({ queryKey: ["profiles"], queryFn: listProfiles, retry: false });
  const profiles = query.data?.items ?? [];
  const filteredProfiles = useMemo(() => filterProfiles(profiles, searchQuery, statusFilter), [profiles, searchQuery, statusFilter]);

  const invalidateProfileData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["profiles"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["tokens"] })
    ]);
  };

  const resetEdit = () => {
    setEditingProfileId(null);
    setEditForm(initialProfileEditFormState);
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
        resetEdit();
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

  return {
    editForm,
    editingProfileId,
    emptyLabel,
    error,
    filteredProfiles,
    form,
    profiles,
    notice,
    pending,
    searchQuery,
    selectedProfile,
    statusFilter,
    createProfile: createMutation.mutate,
    deleteProfile: (profile: ProfileDto) => deleteMutation.mutate(profile.id),
    resetEdit,
    saveEdit,
    setEditForm,
    setForm,
    setNotice,
    setSearchQuery,
    setSelectedProfile,
    setStatusFilter,
    startEdit,
    toggleEnabled: (profile: ProfileDto) => updateMutation.mutate({ id: profile.id, input: { enabled: !profile.enabled } })
  };
}

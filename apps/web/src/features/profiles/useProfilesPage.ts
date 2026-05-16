import { useEffect, useMemo, useState } from "react";
import type { CreateProfileModuleInput, ProfileDto, ProfileModuleDto, UpdateProfileInput, UpdateProfileModuleInput } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProfile,
  createProfileModule,
  createProfileRule,
  deleteProfile,
  deleteProfileModule,
  listProfileModules,
  listProfileRules,
  listProfiles,
  updateProfile,
  updateProfileModule
} from "./api";
import type { ProfileBuildPreview } from "./profileImport";
import { buildMergePreview } from "./profileImport";
import { initialProfileEditFormState, initialProfileFormState } from "./types";
import { filterProfiles, toDuplicateProfileInput } from "./utils";

const profilePageSizeOptions = [10, 20, 30, 40, 50, 70, 100] as const;
const defaultProfilePageSize = profilePageSizeOptions[0];

export function useProfilesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialProfileFormState);
  const [editForm, setEditForm] = useState(initialProfileEditFormState);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ProfileDto | null>(null);
  const [mergePreview, setMergePreview] = useState<ProfileBuildPreview | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(defaultProfilePageSize);
  const query = useQuery({ queryKey: ["profiles"], queryFn: listProfiles, retry: false });
  const modulesQuery = useQuery({ queryKey: ["profile-modules"], queryFn: listProfileModules, retry: false });
  const profiles = query.data?.items ?? [];
  const profileModules = modulesQuery.data?.items ?? [];
  const filteredProfiles = useMemo(() => filterProfiles(profiles, searchQuery, statusFilter), [profiles, searchQuery, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredProfiles.length / pageSize));
  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredProfiles.slice(start, start + pageSize);
  }, [currentPage, filteredProfiles, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage((current) => Math.min(Math.max(current, 1), pageCount));
  }, [pageCount]);

  const invalidateProfileData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["profiles"] }),
      queryClient.invalidateQueries({ queryKey: ["profile-rules"] }),
      queryClient.invalidateQueries({ queryKey: ["profile-modules"] }),
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

  const duplicateMutation = useMutation({
    mutationFn: async (profile: ProfileDto) => {
      const createdProfile = await createProfile(toDuplicateProfileInput(profile, profiles));
      const rules = await listProfileRules(profile.id);

      // 复用现有规则端点逐条复制，避免前端新增按钮时要求后端增加专用接口。
      for (const rule of rules.items) {
        await createProfileRule(createdProfile.id, {
          content: rule.content ?? {},
          enabled: Boolean(rule.enabled),
          format: rule.format ?? "common",
          position: rule.position,
          rule: rule.rule
        });
      }

      return createdProfile;
    },
    onSuccess: async (profile) => {
      setNotice(`配置档「${profile.name}」已复制`);
      await invalidateProfileData();
    }
  });

  const createFromPreviewMutation = useMutation({
    mutationFn: async (preview: ProfileBuildPreview) => {
      const profile = await createProfile({
        default_strategy: preview.defaultStrategy,
        description: preview.description,
        enabled: true,
        name: preview.name
      });

      for (const rule of preview.rules) {
        await createProfileRule(profile.id, {
          content: rule.content,
          enabled: rule.enabled,
          format: rule.format,
          position: rule.position,
          rule: rule.rule
        });
      }

      for (const module of preview.modules) {
        await createProfileModule({
          content: module.content,
          enabled: module.enabled,
          format: module.format,
          is_default: module.is_default,
          name: module.name,
          profile_id: profile.id,
          type: module.type
        });
      }

      return { moduleCount: preview.modules.length, profile, ruleCount: preview.rules.length };
    },
    onSuccess: async ({ moduleCount, profile, ruleCount }) => {
      setMergePreview(null);
      setNotice(`配置档「${profile.name}」已创建，导入 ${ruleCount} 条规则和 ${moduleCount} 个模块`);
      await invalidateProfileData();
    }
  });

  const mergePreviewMutation = useMutation({
    mutationFn: (input: { defaultStrategy: string; description: string; name: string; profileIds: string[] }) =>
      buildMergePreview({
        ...input,
        profiles,
        loadRules: async (profileId) => (await listProfileRules(profileId)).items
      }),
    onSuccess: (preview) => {
      setMergePreview(preview);
      setNotice("合并预览已生成");
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
  const createModuleMutation = useMutation({
    mutationFn: createProfileModule,
    onSuccess: async () => {
      setNotice("配置模块已创建");
      await invalidateProfileData();
    }
  });
  const updateModuleMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProfileModuleInput }) => updateProfileModule(id, input),
    onSuccess: async () => {
      setNotice("配置模块已更新");
      await invalidateProfileData();
    }
  });
  const deleteModuleMutation = useMutation({
    mutationFn: deleteProfileModule,
    onSuccess: async () => {
      setNotice("配置模块已删除");
      await invalidateProfileData();
    }
  });

  const pending =
    createMutation.isPending ||
    duplicateMutation.isPending ||
    createFromPreviewMutation.isPending ||
    mergePreviewMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    createModuleMutation.isPending ||
    updateModuleMutation.isPending ||
    deleteModuleMutation.isPending;
  const error =
    createMutation.error ??
    duplicateMutation.error ??
    createFromPreviewMutation.error ??
    mergePreviewMutation.error ??
    updateMutation.error ??
    deleteMutation.error ??
    createModuleMutation.error ??
    updateModuleMutation.error ??
    deleteModuleMutation.error ??
    query.error ??
    modulesQuery.error;
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

  function changePageSize(value: number) {
    setPageSize(value);
    setCurrentPage(1);
  }

  return {
    currentPage,
    editForm,
    editingProfileId,
    emptyLabel,
    error,
    filteredProfiles,
    form,
    mergePreview,
    profileModules,
    profiles,
    notice,
    pageCount,
    pageSize,
    pageSizeOptions: profilePageSizeOptions,
    paginatedProfiles,
    pending,
    searchQuery,
    selectedProfile,
    statusFilter,
    createProfile: createMutation.mutate,
    createProfileModule: (input: CreateProfileModuleInput) => createModuleMutation.mutate(input),
    createProfileFromPreview: (preview: ProfileBuildPreview) => createFromPreviewMutation.mutate(preview),
    deleteProfile: (profile: ProfileDto) => deleteMutation.mutate(profile.id),
    deleteProfileModule: (module: ProfileModuleDto) => deleteModuleMutation.mutate(module.id),
    duplicateProfile: (profile: ProfileDto) => duplicateMutation.mutate(profile),
    previewProfileMerge: (input: { defaultStrategy: string; description: string; name: string; profileIds: string[] }) =>
      mergePreviewMutation.mutate(input),
    resetEdit,
    saveEdit,
    setCurrentPage,
    setEditForm,
    setForm,
    setNotice,
    setPageSize: changePageSize,
    setSearchQuery,
    setSelectedProfile,
    setStatusFilter,
    startEdit,
    toggleEnabled: (profile: ProfileDto) => updateMutation.mutate({ id: profile.id, input: { enabled: !profile.enabled } }),
    updateProfileModule: (module: ProfileModuleDto, input: UpdateProfileModuleInput) => updateModuleMutation.mutate({ id: module.id, input })
  };
}

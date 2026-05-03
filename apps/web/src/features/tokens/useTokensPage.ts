import { useState } from "react";
import type { SubscribeTokenDto, UpdateSubscribeTokenInput } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listProfiles } from "../profiles/api";
import { createToken, deleteToken, listTokens, resetToken as resetTokenRequest, updateToken } from "./api";
import { initialTokenEditFormState, initialTokenFormState } from "./types";
import { useTokenOutputCenter } from "./useTokenOutputCenter";
import { useTokenOutputDiagnostics } from "./useTokenOutputDiagnostics";
import { copyAllSubscriptionUrls, subscriptionUrl } from "./subscriptionOutput";
import { filterTokens, toDatetimeLocalValue } from "./utils";

export function useTokensPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialTokenFormState);
  const [editForm, setEditForm] = useState(initialTokenEditFormState);
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const outputCenter = useTokenOutputCenter(setNotice);
  const query = useQuery({ queryKey: ["tokens"], queryFn: listTokens, retry: false });
  const profilesQuery = useQuery({ queryKey: ["profiles"], queryFn: listProfiles, retry: false });
  const tokens = query.data?.items ?? [];
  const profiles = profilesQuery.data?.items ?? [];
  const filteredTokens = filterTokens(tokens, searchQuery);
  const outputToken = filteredTokens.find((token) => token.id === outputCenter.outputTokenId) ?? filteredTokens[0] ?? null;
  const { diagnostics, diagnosticsError } = useTokenOutputDiagnostics(outputToken, profiles);

  const invalidateTokenData = async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ["tokens"] }), queryClient.invalidateQueries({ queryKey: ["dashboard"] })]);
  };

  const resetEdit = () => {
    setEditingTokenId(null);
    setEditForm(initialTokenEditFormState);
  };

  const createMutation = useMutation({
    mutationFn: createToken,
    onSuccess: async () => {
      setForm(initialTokenFormState);
      setNotice("订阅令牌已创建");
      await invalidateTokenData();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubscribeTokenInput }) => updateToken(id, input),
    onSuccess: async (_token, variables) => {
      if (variables.input.name !== undefined || variables.input.expires_at !== undefined) {
        resetEdit();
        setNotice("订阅令牌已更新");
      }

      await invalidateTokenData();
    }
  });

  const resetMutation = useMutation({ mutationFn: resetTokenRequest, onSuccess: () => finishTokenAction("令牌已重置，旧订阅地址已失效") });
  const deleteMutation = useMutation({ mutationFn: deleteToken, onSuccess: () => finishTokenAction("订阅令牌已删除") });
  const pending = createMutation.isPending || updateMutation.isPending || resetMutation.isPending || deleteMutation.isPending;
  const error =
    createMutation.error ?? updateMutation.error ?? resetMutation.error ?? deleteMutation.error ?? query.error ?? profilesQuery.error ?? diagnosticsError;
  const emptyLabel = tokens.length === 0 ? "还没有订阅令牌" : "没有匹配的订阅令牌";

  async function handleCopy(token: SubscribeTokenDto) {
    if (!navigator.clipboard) {
      setNotice("当前浏览器不支持自动复制，请手动复制订阅路径");
      return;
    }

    await navigator.clipboard.writeText(subscriptionUrl(token.token, outputCenter.copyFormat));
    setNotice("订阅地址已复制");
  }

  function openSubscription(token: SubscribeTokenDto) {
    window.open(subscriptionUrl(token.token, outputCenter.copyFormat), "_blank", "noopener,noreferrer");
  }

  async function copyAllFormats(token: SubscribeTokenDto) {
    if (await copyAllSubscriptionUrls(token.token)) {
      setNotice("全部格式订阅地址已复制");
    } else {
      setNotice("当前浏览器不支持自动复制，请手动复制订阅路径");
    }
  }

  function startEdit(token: SubscribeTokenDto) {
    setNotice(null);
    setEditingTokenId(token.id);
    setEditForm({ name: token.name, expires_at: toDatetimeLocalValue(token.expires_at) });
  }

  function saveEdit(token: SubscribeTokenDto) {
    updateMutation.mutate({
      id: token.id,
      input: { name: editForm.name.trim() || token.name, expires_at: editForm.expires_at.trim() || null }
    });
  }

  async function finishTokenAction(message: string) {
    setNotice(message);
    await invalidateTokenData();
  }

  return {
    copyFormat: outputCenter.copyFormat,
    editForm,
    editingTokenId,
    emptyLabel,
    error,
    filteredTokens,
    form,
    outputDiagnostics: diagnostics,
    notice,
    outputToken,
    outputTokenId: outputToken?.id ?? "",
    pending,
    previewContent: outputCenter.previewContent,
    previewError: outputCenter.previewError,
    previewPending: outputCenter.previewPending,
    previewSource: outputCenter.previewSource,
    healthCheckPending: outputCenter.healthCheckPending,
    healthCheckResult: outputCenter.healthCheckResult,
    profiles,
    searchQuery,
    clearPreviewContent: outputCenter.clearPreviewContent,
    copyAllFormats,
    copyPreviewContent: outputCenter.copyPreviewContent,
    createToken: createMutation.mutate,
    deleteToken: (token: SubscribeTokenDto) => deleteMutation.mutate(token.id),
    handleCopy,
    checkSubscriptionHealth: outputCenter.checkSubscriptionHealth,
    openSubscription,
    resetEdit,
    resetToken: (token: SubscribeTokenDto) => resetMutation.mutate(token.id),
    saveEdit,
    setCopyFormat: outputCenter.setCopyFormat,
    setEditForm,
    setForm,
    setOutputTokenId: outputCenter.setOutputTokenId,
    setSearchQuery,
    startEdit,
    downloadPreviewContent: outputCenter.downloadPreviewContent,
    previewSubscription: outputCenter.previewSubscription,
    updateProfileBinding: (token: SubscribeTokenDto, profileId: string | null) => updateMutation.mutate({ id: token.id, input: { profile_id: profileId } }),
    toggleEnabled: (token: SubscribeTokenDto) => updateMutation.mutate({ id: token.id, input: { enabled: !token.enabled } })
  };
}

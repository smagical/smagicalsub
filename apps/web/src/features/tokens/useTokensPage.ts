import { useState } from "react";
import type { SubscribeTokenDto, UpdateSubscribeTokenInput } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listProfiles } from "../profiles/api";
import { createToken, deleteToken, listTokens, resetToken as resetTokenRequest, updateToken } from "./api";
import { initialTokenEditFormState, initialTokenFormState, type TokenSubscriptionFormat } from "./types";
import { filterTokens, loadSubscriptionPreview, subscriptionUrl, toDatetimeLocalValue } from "./utils";

export function useTokensPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialTokenFormState);
  const [editForm, setEditForm] = useState(initialTokenEditFormState);
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [copyFormat, setCopyFormat] = useState<TokenSubscriptionFormat>("clash");
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewPending, setPreviewPending] = useState(false);
  const query = useQuery({ queryKey: ["tokens"], queryFn: listTokens, retry: false });
  const profilesQuery = useQuery({ queryKey: ["profiles"], queryFn: listProfiles, retry: false });
  const tokens = query.data?.items ?? [];
  const profiles = profilesQuery.data?.items ?? [];
  const filteredTokens = filterTokens(tokens, searchQuery);

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
  const error = createMutation.error ?? updateMutation.error ?? resetMutation.error ?? deleteMutation.error ?? query.error ?? profilesQuery.error;
  const emptyLabel = tokens.length === 0 ? "还没有订阅令牌" : "没有匹配的订阅令牌";

  async function handleCopy(token: SubscribeTokenDto) {
    if (!navigator.clipboard) {
      setNotice("当前浏览器不支持自动复制，请手动复制订阅路径");
      return;
    }

    await navigator.clipboard.writeText(subscriptionUrl(token.token, copyFormat));
    setNotice("订阅地址已复制");
  }

  function openSubscription(token: SubscribeTokenDto) {
    window.open(subscriptionUrl(token.token, copyFormat), "_blank", "noopener,noreferrer");
  }

  async function previewSubscription(token: SubscribeTokenDto) {
    setPreviewPending(true);
    setPreviewError(null);

    try {
      setPreviewContent(await loadSubscriptionPreview(token.token, copyFormat));
    } catch (error) {
      setPreviewContent("");
      setPreviewError(error instanceof Error ? error.message : "订阅预览失败");
    } finally {
      setPreviewPending(false);
    }
  }

  async function copyPreviewContent() {
    if (!navigator.clipboard || !previewContent) {
      return;
    }

    await navigator.clipboard.writeText(previewContent);
    setNotice("预览内容已复制");
  }

  function changeCopyFormat(format: TokenSubscriptionFormat) {
    setCopyFormat(format);
    setPreviewContent("");
    setPreviewError(null);
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
    copyFormat,
    editForm,
    editingTokenId,
    emptyLabel,
    error,
    filteredTokens,
    form,
    notice,
    pending,
    previewContent,
    previewError,
    previewPending,
    profiles,
    searchQuery,
    clearPreviewContent: () => {
      setPreviewContent("");
      setPreviewError(null);
    },
    copyPreviewContent,
    createToken: createMutation.mutate,
    deleteToken: (token: SubscribeTokenDto) => deleteMutation.mutate(token.id),
    handleCopy,
    openSubscription,
    previewSubscription,
    resetEdit,
    resetToken: (token: SubscribeTokenDto) => resetMutation.mutate(token.id),
    saveEdit,
    setCopyFormat: changeCopyFormat,
    setEditForm,
    setForm,
    setSearchQuery,
    startEdit,
    updateProfileBinding: (token: SubscribeTokenDto, profileId: string | null) => updateMutation.mutate({ id: token.id, input: { profile_id: profileId } }),
    toggleEnabled: (token: SubscribeTokenDto) => updateMutation.mutate({ id: token.id, input: { enabled: !token.enabled } })
  };
}

import { useEffect, useMemo, useState } from "react";
import type { ProfileModuleDto, SubscribeTokenDto, UpdateSubscribeTokenInput } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listProfiles } from "../profiles/api";
import { listNodes } from "../nodes/api";
import { createToken, deleteToken, listProfileModules, listTokens, resetToken as resetTokenRequest, updateToken } from "./api";
import { initialTokenEditFormState, initialTokenFormState } from "./types";
import { useTokenOutputCenter } from "./useTokenOutputCenter";
import { useTokenOutputDiagnostics } from "./useTokenOutputDiagnostics";
import { copyAllSubscriptionUrls, subscriptionUrl } from "./subscriptionOutput";
import { filterTokens, toDatetimeLocalValue } from "./utils";

const tokenPageSizeOptions = [10, 20, 30, 40, 50, 70, 100] as const;
const defaultTokenPageSize = tokenPageSizeOptions[0];

export function useTokensPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialTokenFormState);
  const [editForm, setEditForm] = useState(initialTokenEditFormState);
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(defaultTokenPageSize);
  const [notice, setNotice] = useState<string | null>(null);
  const outputCenter = useTokenOutputCenter(setNotice);
  const query = useQuery({ queryKey: ["tokens"], queryFn: listTokens, retry: false });
  const profilesQuery = useQuery({ queryKey: ["profiles"], queryFn: listProfiles, retry: false });
  const nodesQuery = useQuery({ queryKey: ["nodes"], queryFn: listNodes, retry: false });
  const modulesQuery = useQuery({ queryKey: ["profile-modules"], queryFn: listProfileModules, retry: false });
  const tokens = query.data?.items ?? [];
  const profiles = profilesQuery.data?.items ?? [];
  const nodes = nodesQuery.data?.items ?? [];
  const profileModules = modulesQuery.data?.items ?? [];
  const filteredTokens = useMemo(() => filterTokens(tokens, searchQuery), [searchQuery, tokens]);
  const pageCount = Math.max(1, Math.ceil(filteredTokens.length / pageSize));
  const paginatedTokens = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredTokens.slice(start, start + pageSize);
  }, [currentPage, filteredTokens, pageSize]);
  const outputToken = filteredTokens.find((token) => token.id === outputCenter.outputTokenId) ?? filteredTokens[0] ?? null;
  const { diagnostics, diagnosticsError } = useTokenOutputDiagnostics(outputToken, profiles);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage((current) => Math.min(Math.max(current, 1), pageCount));
  }, [pageCount]);

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
      if (isTokenFormEditInput(variables.input)) {
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
    createMutation.error ??
    updateMutation.error ??
    resetMutation.error ??
    deleteMutation.error ??
    query.error ??
    profilesQuery.error ??
    modulesQuery.error ??
    diagnosticsError;
  const emptyLabel = tokens.length === 0 ? "还没有订阅令牌" : "没有匹配的订阅令牌";

  async function handleCopy(token: SubscribeTokenDto) {
    if (!navigator.clipboard) {
      setNotice("当前浏览器不支持自动复制，请手动复制订阅路径");
      return;
    }

    await navigator.clipboard.writeText(subscriptionUrl(token.token, outputCenter.copyFormat, token.custom_path));
    setNotice("订阅地址已复制");
  }

  function openSubscription(token: SubscribeTokenDto) {
    window.open(subscriptionUrl(token.token, outputCenter.copyFormat, token.custom_path), "_blank", "noopener,noreferrer");
  }

  async function copyAllFormats(token: SubscribeTokenDto) {
    if (await copyAllSubscriptionUrls(token.token, token.custom_path)) {
      setNotice("全部格式订阅地址已复制");
    } else {
      setNotice("当前浏览器不支持自动复制，请手动复制订阅路径");
    }
  }

  function startEdit(token: SubscribeTokenDto) {
    setNotice(null);
    setEditingTokenId(token.id);
    setEditForm({
      name: token.name,
      profile_id: token.profile_id ?? "",
      custom_path: token.custom_path ?? "",
      node_ids: token.node_ids,
      module_bindings: token.module_bindings,
      expires_at: toDatetimeLocalValue(token.expires_at),
      enabled: Boolean(token.enabled)
    });
  }

  function saveEdit(token: SubscribeTokenDto) {
    updateMutation.mutate({
      id: token.id,
      input: {
        name: editForm.name.trim() || token.name,
        profile_id: editForm.profile_id || null,
        custom_path: editForm.custom_path.trim() || null,
        node_ids: editForm.node_ids,
        module_bindings: editForm.module_bindings,
        expires_at: editForm.expires_at.trim() || null,
        enabled: editForm.enabled
      }
    });
  }

  async function finishTokenAction(message: string) {
    setNotice(message);
    await invalidateTokenData();
  }

  function changePageSize(value: number) {
    setPageSize(value);
    setCurrentPage(1);
  }

  return {
    copyFormat: outputCenter.copyFormat,
    currentPage,
    editForm,
    editingTokenId,
    emptyLabel,
    error,
    filteredTokens,
    form,
    tokens,
    outputDiagnostics: diagnostics,
    nodes,
    notice,
    pageCount,
    pageSize,
    pageSizeOptions: tokenPageSizeOptions,
    paginatedTokens,
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
    profileModules,
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
    setCurrentPage,
    setEditForm,
    setForm,
    setOutputTokenId: outputCenter.setOutputTokenId,
    setPageSize: changePageSize,
    setSearchQuery,
    startEdit,
    downloadPreviewContent: outputCenter.downloadPreviewContent,
    previewSubscription: outputCenter.previewSubscription,
    updateNodeSelection: (token: SubscribeTokenDto, nodeIds: string[]) => updateMutation.mutate({ id: token.id, input: { node_ids: nodeIds } }),
    toggleEnabled: (token: SubscribeTokenDto) => updateMutation.mutate({ id: token.id, input: { enabled: !token.enabled } })
  };
}

function isTokenFormEditInput(input: UpdateSubscribeTokenInput) {
  return (
    input.name !== undefined ||
    input.profile_id !== undefined ||
    input.custom_path !== undefined ||
    input.node_ids !== undefined ||
    input.expires_at !== undefined
  );
}

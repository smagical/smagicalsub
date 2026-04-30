import { useState } from "react";
import type { SubscribeTokenDto, UpdateSubscribeTokenInput } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleHeading } from "../../shared/ModuleHeading";
import { listProfiles } from "../profiles/api";
import { createToken, deleteToken, listTokens, resetToken, updateToken } from "./api";
import { TokenForm } from "./TokenForm";
import { TokensTable } from "./TokensTable";
import { initialTokenEditFormState, initialTokenFormState, tokenSubscriptionFormats, type TokenSubscriptionFormat } from "./types";
import { filterTokens, subscriptionUrl, toDatetimeLocalValue } from "./utils";

export function TokensPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialTokenFormState);
  const [editForm, setEditForm] = useState(initialTokenEditFormState);
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [copyFormat, setCopyFormat] = useState<TokenSubscriptionFormat>("clash");
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["tokens"], queryFn: listTokens, retry: false });
  const tokens = query.data?.items ?? [];
  const profilesQuery = useQuery({ queryKey: ["profiles"], queryFn: listProfiles, retry: false });
  const profiles = profilesQuery.data?.items ?? [];
  const filteredTokens = filterTokens(tokens, searchQuery);

  const invalidateTokenData = async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ["tokens"] }), queryClient.invalidateQueries({ queryKey: ["dashboard"] })]);
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
        setEditingTokenId(null);
        setEditForm(initialTokenEditFormState);
        setNotice("订阅令牌已更新");
      }

      await invalidateTokenData();
    }
  });

  const resetMutation = useMutation({ mutationFn: resetToken, onSuccess: () => finishTokenAction("令牌已重置，旧订阅地址已失效") });
  const deleteMutation = useMutation({ mutationFn: deleteToken, onSuccess: () => finishTokenAction("订阅令牌已删除") });

  const pending = createMutation.isPending || updateMutation.isPending || resetMutation.isPending || deleteMutation.isPending;
  const error = createMutation.error ?? updateMutation.error ?? resetMutation.error ?? deleteMutation.error ?? query.error;
  const pageError = error ?? profilesQuery.error;
  const emptyLabel = tokens.length === 0 ? "还没有订阅令牌" : "没有匹配的订阅令牌";

  async function handleCopy(token: SubscribeTokenDto) {
    if (!navigator.clipboard) {
      setNotice("当前浏览器不支持自动复制，请手动复制订阅路径");
      return;
    }

    await navigator.clipboard.writeText(subscriptionUrl(token.token, copyFormat));
    setNotice("订阅地址已复制");
  }

  function startEdit(token: SubscribeTokenDto) {
    setNotice(null);
    setEditingTokenId(token.id);
    setEditForm({
      name: token.name,
      expires_at: toDatetimeLocalValue(token.expires_at)
    });
  }

  function saveEdit(token: SubscribeTokenDto) {
    updateMutation.mutate({
      id: token.id,
      input: {
        name: editForm.name.trim() || token.name,
        expires_at: editForm.expires_at.trim() || null
      }
    });
  }

  async function finishTokenAction(message: string) {
    setNotice(message);
    await invalidateTokenData();
  }

  function cancelEdit() {
    setEditingTokenId(null);
    setEditForm(initialTokenEditFormState);
  }

  function deleteWithConfirm(token: SubscribeTokenDto) {
    if (window.confirm(`删除令牌「${token.name}」？`)) {
      deleteMutation.mutate(token.id);
    }
  }

  function resetWithConfirm(token: SubscribeTokenDto) {
    if (window.confirm(`重置令牌「${token.name}」？旧订阅地址会立即失效。`)) {
      resetMutation.mutate(token.id);
    }
  }

  return (
    <section className="panel wide">
      <ModuleHeading eyebrow="Tokens" title="订阅令牌" description="创建订阅访问令牌，控制启停、过期、重置和删除。" />
      <TokenForm form={form} pending={pending} profiles={profiles} setForm={setForm} onSubmit={(value) => createMutation.mutate(value)} />
      <div className="filter-row">
        <label>
          <span>搜索令牌</span>
          <input onChange={(event) => setSearchQuery(event.target.value)} placeholder="名称 / 令牌 / 配置档" type="search" value={searchQuery} />
        </label>
        <label>
          <span>复制格式</span>
          <select onChange={(event) => setCopyFormat(event.target.value as TokenSubscriptionFormat)} value={copyFormat}>
            {tokenSubscriptionFormats.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {notice ? <p className="success-text">{notice}</p> : null}
      {pageError instanceof Error ? <p className="error-text">{pageError.message}</p> : null}

      {filteredTokens.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <TokensTable
          copyFormat={copyFormat}
          editForm={editForm}
          editingTokenId={editingTokenId}
          pending={pending}
          profiles={profiles}
          tokens={filteredTokens}
          onCancelEdit={cancelEdit}
          onCopy={(token) => void handleCopy(token)}
          onDelete={deleteWithConfirm}
          onReset={resetWithConfirm}
          onEditFormChange={setEditForm}
          onSaveEdit={saveEdit}
          onStartEdit={startEdit}
          onProfileChange={(token, profileId) => updateMutation.mutate({ id: token.id, input: { profile_id: profileId } })}
          onToggleEnabled={(token) => updateMutation.mutate({ id: token.id, input: { enabled: !token.enabled } })}
        />
      )}
    </section>
  );
}

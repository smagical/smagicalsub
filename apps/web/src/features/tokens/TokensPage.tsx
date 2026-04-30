import { useState } from "react";
import type { SubscribeTokenDto, UpdateSubscribeTokenInput } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleHeading } from "../../shared/ModuleHeading";
import { listProfiles } from "../profiles/api";
import { createToken, deleteToken, listTokens, resetToken, updateToken } from "./api";
import { TokenForm } from "./TokenForm";
import { TokensTable } from "./TokensTable";
import { initialTokenFormState } from "./types";
import { subscriptionUrl } from "./utils";

export function TokensPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialTokenFormState);
  const [notice, setNotice] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["tokens"],
    queryFn: listTokens,
    retry: false
  });
  const tokens = query.data?.items ?? [];
  const profilesQuery = useQuery({
    queryKey: ["profiles"],
    queryFn: listProfiles,
    retry: false
  });
  const profiles = profilesQuery.data?.items ?? [];

  const invalidateTokenData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tokens"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    ]);
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
    onSuccess: invalidateTokenData
  });

  const resetMutation = useMutation({
    mutationFn: resetToken,
    onSuccess: async () => {
      setNotice("令牌已重置，旧订阅地址已失效");
      await invalidateTokenData();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteToken,
    onSuccess: async () => {
      setNotice("订阅令牌已删除");
      await invalidateTokenData();
    }
  });

  const pending =
    createMutation.isPending || updateMutation.isPending || resetMutation.isPending || deleteMutation.isPending;
  const error = createMutation.error ?? updateMutation.error ?? resetMutation.error ?? deleteMutation.error ?? query.error;
  const pageError = error ?? profilesQuery.error;

  async function handleCopy(token: SubscribeTokenDto) {
    if (!navigator.clipboard) {
      setNotice("当前浏览器不支持自动复制，请手动复制订阅路径");
      return;
    }

    await navigator.clipboard.writeText(subscriptionUrl(token.token));
    setNotice("订阅地址已复制");
  }

  return (
    <section className="panel wide">
      <ModuleHeading eyebrow="Tokens" title="订阅令牌" description="创建订阅访问令牌，控制启停、过期、重置和删除。" />

      <TokenForm
        form={form}
        pending={pending}
        profiles={profiles}
        setForm={setForm}
        onSubmit={(value) => createMutation.mutate(value)}
      />

      {notice ? <p className="success-text">{notice}</p> : null}
      {pageError instanceof Error ? <p className="error-text">{pageError.message}</p> : null}

      {tokens.length === 0 ? (
        <EmptyState label="还没有订阅令牌" />
      ) : (
        <TokensTable
          pending={pending}
          profiles={profiles}
          tokens={tokens}
          onCopy={(token) => void handleCopy(token)}
          onDelete={(token) => {
            if (window.confirm(`删除令牌「${token.name}」？`)) {
              deleteMutation.mutate(token.id);
            }
          }}
          onReset={(token) => {
            if (window.confirm(`重置令牌「${token.name}」？旧订阅地址会立即失效。`)) {
              resetMutation.mutate(token.id);
            }
          }}
          onProfileChange={(token, profileId) => updateMutation.mutate({ id: token.id, input: { profile_id: profileId } })}
          onToggleEnabled={(token) => updateMutation.mutate({ id: token.id, input: { enabled: !token.enabled } })}
        />
      )}
    </section>
  );
}

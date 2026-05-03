import type { CreateSubscribeTokenInput, SubscribeTokenDto } from "@smagicalsub/shared";
import { downloadCsv } from "../../lib/download-csv";
import type { TokenFormState } from "./types";
export * from "./subscriptionOutput";

export function toCreateTokenInput(form: TokenFormState): CreateSubscribeTokenInput {
  return {
    name: form.name.trim(),
    profile_id: form.profile_id || null,
    enabled: form.enabled,
    expires_at: form.expires_at.trim() || null
  };
}

export function maskToken(token: string) {
  if (token.length <= 12) {
    return token;
  }

  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

export function toDatetimeLocalValue(value: string | null) {
  return value ? value.replace(" ", "T").slice(0, 16) : "";
}

export function filterTokens(tokens: SubscribeTokenDto[], searchQuery: string) {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return tokens;
  }

  return tokens.filter((token) =>
    [token.name, token.token, token.profile_name ?? "", token.expires_at ?? "", token.last_used_at ?? ""].some((value) =>
      value.toLowerCase().includes(query)
    )
  );
}

export function exportTokensCsv(tokens: SubscribeTokenDto[]) {
  const rows = tokens.map((token) => [
    token.name,
    maskToken(token.token),
    token.profile_name ?? "未绑定",
    token.enabled ? "启用" : "停用",
    token.expires_at ?? "永不过期",
    token.last_used_at ?? "未使用",
    token.created_at
  ]);

  downloadCsv("tokens", [["名称", "令牌", "配置档", "状态", "过期时间", "最近使用", "创建时间"], ...rows]);
}

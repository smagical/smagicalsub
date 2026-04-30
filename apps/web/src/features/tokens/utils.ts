import type { CreateSubscribeTokenInput, SubscribeTokenDto } from "@smagicalsub/shared";
import type { TokenFormState, TokenSubscriptionFormat } from "./types";

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

export function subscriptionPath(token: string) {
  return `/sub/${token}`;
}

export function subscriptionFormatPath(token: string, format: TokenSubscriptionFormat) {
  return `${subscriptionPath(token)}?format=${encodeURIComponent(format)}`;
}

export function subscriptionUrl(token: string, format: TokenSubscriptionFormat) {
  const path = subscriptionFormatPath(token, format);
  return typeof window === "undefined" ? path : new URL(path, window.location.origin).toString();
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

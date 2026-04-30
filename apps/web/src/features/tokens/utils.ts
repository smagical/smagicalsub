import type { CreateSubscribeTokenInput } from "@smagicalsub/shared";
import type { TokenFormState } from "./types";

export function toCreateTokenInput(form: TokenFormState): CreateSubscribeTokenInput {
  return {
    name: form.name.trim(),
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

export function subscriptionUrl(token: string) {
  const path = subscriptionPath(token);
  return typeof window === "undefined" ? path : new URL(path, window.location.origin).toString();
}

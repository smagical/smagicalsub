import type {
  CreateSubscribeTokenInput,
  ListDto,
  SubscribeTokenDto,
  UpdateSubscribeTokenInput
} from "@smagicalsub/shared";
import { deleteJson, getJson, patchJson, postJson } from "../../lib/api-client";

export function listTokens() {
  return getJson<ListDto<SubscribeTokenDto>>("/api/tokens");
}

export function createToken(input: CreateSubscribeTokenInput) {
  return postJson<SubscribeTokenDto>("/api/tokens", input);
}

export function updateToken(id: string, input: UpdateSubscribeTokenInput) {
  return patchJson<SubscribeTokenDto>(`/api/tokens/${id}`, input);
}

export function resetToken(id: string) {
  return postJson<SubscribeTokenDto>(`/api/tokens/${id}/reset`);
}

export function deleteToken(id: string) {
  return deleteJson<{ id: string }>(`/api/tokens/${id}`);
}

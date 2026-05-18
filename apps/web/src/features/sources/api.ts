import type {
  CreateSubscriptionSourceInput,
  ListDto,
  SourceDto,
  SourceRefreshAllDto,
  SourceRefreshDto,
  UpdateSubscriptionSourceInput
} from "@smagicalsub/shared";
import { deleteJson, getJson, patchJson, postJson } from "../../lib/api-client";

export function listSources() {
  return getJson<ListDto<SourceDto>>("/api/sources");
}

export function createSource(input: CreateSubscriptionSourceInput) {
  return postJson<SourceDto>("/api/sources", input);
}

export function updateSource(id: string, input: UpdateSubscriptionSourceInput) {
  return patchJson<SourceDto>(`/api/sources/${id}`, input);
}

export function deleteSource(id: string) {
  return deleteJson<{ id: string }>(`/api/sources/${id}`);
}

export function refreshSource(id: string) {
  return postJson<SourceRefreshDto>(`/api/sources/${id}/refresh`);
}

export function refreshAllSources() {
  return postJson<SourceRefreshAllDto>("/api/sources/refresh");
}

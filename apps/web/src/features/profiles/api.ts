import type { CreateProfileInput, ListDto, ProfileDto, UpdateProfileInput } from "@smagicalsub/shared";
import { deleteJson, getJson, patchJson, postJson } from "../../lib/api-client";

export function listProfiles() {
  return getJson<ListDto<ProfileDto>>("/api/profiles");
}

export function createProfile(input: CreateProfileInput) {
  return postJson<ProfileDto>("/api/profiles", input);
}

export function updateProfile(id: string, input: UpdateProfileInput) {
  return patchJson<ProfileDto>(`/api/profiles/${id}`, input);
}

export function deleteProfile(id: string) {
  return deleteJson<{ id: string }>(`/api/profiles/${id}`);
}

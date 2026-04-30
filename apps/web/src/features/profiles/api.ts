import type {
  CreateProfileInput,
  CreateProfileRuleInput,
  ListDto,
  ProfileDto,
  ProfileRuleDto,
  UpdateProfileInput,
  UpdateProfileRuleInput
} from "@smagicalsub/shared";
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

export function listProfileRules(profileId: string) {
  return getJson<ListDto<ProfileRuleDto>>(`/api/profiles/${profileId}/rules`);
}

export function createProfileRule(profileId: string, input: CreateProfileRuleInput) {
  return postJson<ProfileRuleDto>(`/api/profiles/${profileId}/rules`, input);
}

export function updateProfileRule(profileId: string, ruleId: string, input: UpdateProfileRuleInput) {
  return patchJson<ProfileRuleDto>(`/api/profiles/${profileId}/rules/${ruleId}`, input);
}

export function deleteProfileRule(profileId: string, ruleId: string) {
  return deleteJson<{ id: string }>(`/api/profiles/${profileId}/rules/${ruleId}`);
}

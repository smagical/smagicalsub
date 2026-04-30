import type { ListDto, ProfileDto } from "@smagicalsub/shared";
import { getJson } from "../../lib/api-client";

export function listProfiles() {
  return getJson<ListDto<ProfileDto>>("/api/profiles");
}


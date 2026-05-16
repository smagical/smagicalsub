import type { ProfileModuleFormat, ProfileModuleType } from "@smagicalsub/shared";

export type ProfileModuleRow = {
  id: string;
  owner_id: string | null;
  profile_id: string | null;
  profile_name: string | null;
  name: string;
  format: ProfileModuleFormat;
  type: ProfileModuleType;
  content_json: string;
  enabled: number;
  is_default: number;
  created_at: string;
  updated_at: string;
};

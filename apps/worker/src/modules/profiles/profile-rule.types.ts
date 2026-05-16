import type { ProfileRuleFormat } from "@smagicalsub/shared";

export type ProfileRuleRow = {
  id: string;
  profile_id: string;
  position: number;
  format: ProfileRuleFormat;
  rule: string;
  content_json: string;
  enabled: number;
};

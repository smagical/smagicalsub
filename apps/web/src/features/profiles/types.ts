import type { ProfileRuleFormat } from "@smagicalsub/shared";

export type ProfileFormState = {
  name: string;
  description: string;
  default_strategy: string;
  enabled: boolean;
};

export const initialProfileFormState: ProfileFormState = {
  name: "",
  description: "",
  default_strategy: "Proxy",
  enabled: true
};

export type ProfileEditFormState = {
  name: string;
  description: string;
  default_strategy: string;
};

export const initialProfileEditFormState: ProfileEditFormState = {
  name: "",
  description: "",
  default_strategy: ""
};

export type ProfileRuleFormState = {
  content: string;
  format: ProfileRuleFormat;
  rule: string;
  position: string;
  enabled: boolean;
};

export type ProfileRuleEditFormState = {
  content: string;
  format: ProfileRuleFormat;
  rule: string;
  position: string;
};

export const initialProfileRuleFormState: ProfileRuleFormState = {
  content: "{}",
  format: "common",
  rule: "",
  position: "",
  enabled: true
};

export const initialProfileRuleEditFormState: ProfileRuleEditFormState = {
  content: "{}",
  format: "common",
  rule: "",
  position: ""
};

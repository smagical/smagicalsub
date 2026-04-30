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
  rule: string;
  position: string;
  enabled: boolean;
};

export type ProfileRuleEditFormState = {
  rule: string;
  position: string;
};

export const initialProfileRuleFormState: ProfileRuleFormState = {
  rule: "",
  position: "",
  enabled: true
};

export const initialProfileRuleEditFormState: ProfileRuleEditFormState = {
  rule: "",
  position: ""
};

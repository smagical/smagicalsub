import type { ProfileModuleFormat, TokenModuleBindingInput } from "@smagicalsub/shared";

export type TokenFormState = {
  name: string;
  profile_id: string;
  custom_path: string;
  node_ids: string[];
  module_bindings: TokenModuleBindingInput[];
  expires_at: string;
  enabled: boolean;
};

export type TokenEditFormState = {
  name: string;
  profile_id: string;
  custom_path: string;
  node_ids: string[];
  module_bindings: TokenModuleBindingInput[];
  expires_at: string;
  enabled: boolean;
};

export type TokenSubscriptionFormat = "clash" | "v2rayn" | "plain" | "sing-box" | "xray";

export const initialTokenFormState: TokenFormState = {
  name: "",
  profile_id: "",
  custom_path: "",
  node_ids: [],
  module_bindings: [],
  expires_at: "",
  enabled: true
};

export const initialTokenEditFormState: TokenEditFormState = {
  name: "",
  profile_id: "",
  custom_path: "",
  node_ids: [],
  module_bindings: [],
  expires_at: "",
  enabled: true
};

export const tokenModuleFormats: Array<{ label: string; value: ProfileModuleFormat }> = [
  { label: "通用", value: "common" },
  { label: "Clash", value: "clash" },
  { label: "sing-box", value: "sing-box" },
  { label: "Xray", value: "xray" }
];


export const tokenSubscriptionFormats: Array<{ label: string; value: TokenSubscriptionFormat }> = [
  { label: "Clash YAML", value: "clash" },
  { label: "Base64", value: "v2rayn" },
  { label: "明文", value: "plain" },
  { label: "sing-box JSON", value: "sing-box" },
  { label: "Xray JSON", value: "xray" }
];

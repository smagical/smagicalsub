export type TokenFormState = {
  name: string;
  profile_id: string;
  expires_at: string;
  enabled: boolean;
};

export type TokenEditFormState = {
  name: string;
  expires_at: string;
};

export type TokenSubscriptionFormat = "clash" | "v2rayn" | "plain" | "sing-box";

export const initialTokenFormState: TokenFormState = {
  name: "",
  profile_id: "",
  expires_at: "",
  enabled: true
};

export const initialTokenEditFormState: TokenEditFormState = {
  name: "",
  expires_at: ""
};

export const tokenSubscriptionFormats: Array<{ label: string; value: TokenSubscriptionFormat }> = [
  { label: "Clash YAML", value: "clash" },
  { label: "v2rayN Base64", value: "v2rayn" },
  { label: "明文 URI", value: "plain" },
  { label: "sing-box JSON", value: "sing-box" }
];

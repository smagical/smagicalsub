export type TokenFormState = {
  name: string;
  profile_id: string;
  custom_path: string;
  node_ids: string[];
  expires_at: string;
  enabled: boolean;
};

export type TokenEditFormState = {
  name: string;
  custom_path: string;
  node_ids: string[];
  expires_at: string;
};

export type TokenSubscriptionFormat = "clash" | "v2rayn" | "plain" | "sing-box";

export const initialTokenFormState: TokenFormState = {
  name: "",
  profile_id: "",
  custom_path: "",
  node_ids: [],
  expires_at: "",
  enabled: true
};

export const initialTokenEditFormState: TokenEditFormState = {
  name: "",
  custom_path: "",
  node_ids: [],
  expires_at: ""
};

export const tokenSubscriptionFormats: Array<{ label: string; value: TokenSubscriptionFormat }> = [
  { label: "Clash YAML", value: "clash" },
  { label: "v2rayN Base64", value: "v2rayn" },
  { label: "明文 URI", value: "plain" },
  { label: "sing-box JSON", value: "sing-box" }
];

export const tokenFormatHints: Record<TokenSubscriptionFormat, string> = {
  clash: "适合 Clash、Clash Verge、OpenClash 等 YAML 客户端。",
  plain: "输出逐行 URI，便于调试、转存或导入支持明文的客户端。",
  "sing-box": "输出 sing-box JSON 配置，适合服务端或新版客户端。",
  v2rayn: "输出 Base64 订阅，适合 v2rayN、NekoRay 等客户端。"
};

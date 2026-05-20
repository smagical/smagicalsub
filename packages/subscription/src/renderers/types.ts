export type RenderableNode = {
  id?: string;
  name: string;
  protocol?: string;
  config_json: string;
  groups?: string[];
};

export type SubscriptionFormat = "clash" | "base64" | "plain" | "sing-box" | "xray";

export type RenderConfigModule = {
  content: Record<string, unknown>;
  format: "common" | "clash" | "sing-box" | "xray";
  type: string;
};

export type RenderProfileRule = {
  content?: Record<string, unknown>;
  format: "common" | "clash" | "sing-box" | "xray";
  rule: string;
};

export type RenderSubscriptionBaseInput = {
  profileName: string;
  defaultStrategy?: string;
  modules?: RenderConfigModule[];
  profileRules?: RenderProfileRule[];
  rules?: string[];
  nodes: RenderableNode[];
};

export type RenderSubscriptionInput = RenderSubscriptionBaseInput & {
  format: SubscriptionFormat;
};

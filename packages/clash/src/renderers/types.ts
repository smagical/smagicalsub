export type RenderableNode = {
  id?: string;
  name: string;
  protocol?: string;
  config_json: string;
  groups?: string[];
};

export type SubscriptionFormat = "clash" | "v2rayn" | "plain" | "sing-box";

export type RenderSubscriptionBaseInput = {
  profileName: string;
  defaultStrategy?: string;
  nodes: RenderableNode[];
};

export type RenderSubscriptionInput = RenderSubscriptionBaseInput & {
  format: SubscriptionFormat;
};

import { renderClashConfig } from "./renderers/clash";
import { renderPlainSubscription, renderV2rayNSubscription } from "./renderers/plain";
import { renderSingBoxConfig } from "./renderers/sing-box";
import type { RenderSubscriptionInput, SubscriptionFormat } from "./renderers/types";

export type { RenderableNode, RenderSubscriptionBaseInput, RenderSubscriptionInput, SubscriptionFormat } from "./renderers/types";
export { renderClashConfig } from "./renderers/clash";
export { renderPlainSubscription, renderV2rayNSubscription } from "./renderers/plain";
export { renderSingBoxConfig } from "./renderers/sing-box";

export function normalizeSubscriptionFormat(value: string | null | undefined): SubscriptionFormat {
  switch (value?.toLowerCase()) {
    case "v2ray":
    case "v2rayn":
    case "base64":
      return "v2rayn";
    case "text":
    case "plain":
    case "raw":
      return "plain";
    case "singbox":
    case "sing-box":
      return "sing-box";
    case "clash":
    case "yaml":
    case "yml":
    default:
      return "clash";
  }
}

export function renderSubscription(input: RenderSubscriptionInput): string {
  switch (input.format) {
    case "v2rayn":
      return renderV2rayNSubscription(input);
    case "plain":
      return renderPlainSubscription(input);
    case "sing-box":
      return renderSingBoxConfig(input);
    case "clash":
      return renderClashConfig(input);
  }
}

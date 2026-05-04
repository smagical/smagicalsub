import type { TokenSubscriptionFormat } from "./types";
import { subscriptionUrl } from "./subscriptionOutput";

export type SubscriptionHealthResult = {
  detail: string;
  ok: boolean;
  statusText: string;
} | null;

export async function loadSubscriptionHealth(token: string, format: TokenSubscriptionFormat, customPath?: string | null): Promise<SubscriptionHealthResult> {
  try {
    const response = await fetch(subscriptionUrl(token, format, customPath));
    const content = await response.text();
    const trimmed = content.trim();

    if (!response.ok) {
      return { detail: trimmed || "订阅地址不可用", ok: false, statusText: `HTTP ${response.status}` };
    }

    if (!trimmed) {
      return { detail: "订阅响应没有返回内容", ok: false, statusText: "空内容" };
    }

    if (format !== "sing-box") {
      return { detail: "订阅内容正常", ok: true, statusText: "HTTP 200" };
    }

    // sing-box 输出会被客户端直接按 JSON 解析，这里提前捕获格式错误。
    try {
      JSON.parse(trimmed);
    } catch {
      return { detail: "sing-box 订阅不是合法 JSON", ok: false, statusText: "JSON 格式错误" };
    }

    return { detail: "sing-box JSON 格式正常", ok: true, statusText: "HTTP 200" };
  } catch (error) {
    return {
      detail: error instanceof Error ? error.message : "请求订阅地址失败",
      ok: false,
      statusText: "网络错误"
    };
  }
}

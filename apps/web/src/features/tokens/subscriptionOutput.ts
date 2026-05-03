import { downloadText } from "../../lib/download-text";
import { tokenSubscriptionFormats, type TokenSubscriptionFormat } from "./types";

export function subscriptionPath(token: string) {
  return `/sub/${token}`;
}

export function subscriptionFormatPath(token: string, format: TokenSubscriptionFormat) {
  return `${subscriptionPath(token)}?format=${encodeURIComponent(format)}`;
}

export function subscriptionUrl(token: string, format: TokenSubscriptionFormat) {
  const path = subscriptionFormatPath(token, format);
  return typeof window === "undefined" ? path : new URL(path, window.location.origin).toString();
}

export function subscriptionFormatLinks(token: string) {
  return tokenSubscriptionFormats.map((format) => ({
    ...format,
    extension: subscriptionPreviewExtension(format.value),
    path: subscriptionFormatPath(token, format.value),
    url: subscriptionUrl(token, format.value)
  }));
}

export async function loadSubscriptionPreview(token: string, format: TokenSubscriptionFormat) {
  const response = await fetch(subscriptionUrl(token, format));
  const content = await response.text();

  if (!response.ok) {
    throw new Error(content.trim() || `订阅预览失败，HTTP ${response.status}`);
  }

  return content.slice(0, 5000);
}

export function subscriptionPreviewExtension(format: TokenSubscriptionFormat) {
  return format === "sing-box" ? "json" : format === "clash" ? "yaml" : "txt";
}

export function subscriptionPreviewStats(content: string) {
  const lineCount = content ? content.split(/\r?\n/).length : 0;
  return `${lineCount} 行 / ${content.length} 字符`;
}

export function downloadSubscriptionPreview(token: string, format: TokenSubscriptionFormat, content: string) {
  downloadText(`subscription-${token}-${format}`, content, subscriptionPreviewExtension(format));
}

export async function copySubscriptionPreview(content: string) {
  if (!navigator.clipboard || !content) {
    return false;
  }

  await navigator.clipboard.writeText(content);
  return true;
}

export async function copyAllSubscriptionUrls(token: string) {
  if (!navigator.clipboard) {
    return false;
  }

  // 多客户端导入时，一次复制所有格式入口，减少反复切换格式的操作。
  const content = subscriptionFormatLinks(token).map((link) => `${link.label}: ${link.url}`).join("\n");
  await navigator.clipboard.writeText(content);
  return true;
}

import type { SubscriptionFormat } from "@smagicalsub/clash";

const cachedFormats: SubscriptionFormat[] = ["clash", "v2rayn", "plain", "sing-box"];

export function generatedSubscriptionCacheKey(format: SubscriptionFormat, token: string) {
  return `generated_sub:${format}:${token}`;
}

export async function deleteGeneratedSubscriptionCache(kv: KVNamespace, token: string) {
  // 令牌变更会影响所有客户端格式，按已知格式清理可以避免旧内容继续命中。
  await Promise.all(cachedFormats.map((format) => kv.delete(generatedSubscriptionCacheKey(format, token))));
}

export async function deleteGeneratedSubscriptionCaches(kv: KVNamespace, tokens: string[]) {
  // 节点变更会影响全部令牌订阅，集中批量清理可避免各路由重复拼接缓存键。
  await Promise.all(tokens.map((token) => deleteGeneratedSubscriptionCache(kv, token)));
}

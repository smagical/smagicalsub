import type { Env } from "../../env";
import { deleteGeneratedSubscriptionCaches } from "../subscribe/subscribe-cache";
import { listSubscribeTokenValuesByProfileId } from "../tokens/token.repository";

export async function deleteProfileSubscriptionCaches(env: Env, profileId: string) {
  // 配置档名称、默认策略和规则都会进入订阅生成结果，变更后需要清掉绑定令牌缓存。
  const tokenValues = await listSubscribeTokenValuesByProfileId(env.DB, profileId);
  await deleteGeneratedSubscriptionCaches(env.KV, tokenValues);
}

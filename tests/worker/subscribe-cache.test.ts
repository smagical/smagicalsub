import { beforeAll, describe, expect, it } from "vitest";
import { generatedSubscriptionCacheKey } from "../../apps/worker/src/modules/subscribe/subscribe-cache";
import {
  accessLogCount,
  ensureSubscriptionSchema,
  fetchSubscription,
  seedSubscriptionFixture,
  testEnv,
  tokenLastUsedAt,
  waitForAccessLogCount
} from "./subscribe-fixtures";

beforeAll(async () => {
  await ensureSubscriptionSchema();
});

describe("subscription output cache and access logs", () => {
  it("writes generated output to KV and serves cached output on the next request", async () => {
    const fixture = await seedSubscriptionFixture();
    const cacheKey = generatedSubscriptionCacheKey("clash", fixture.path);

    await testEnv.KV.delete(cacheKey);

    const firstResponse = await fetchSubscription(fixture.path, "clash");
    const firstBody = await firstResponse.text();
    const cachedBody = await testEnv.KV.get(cacheKey);

    expect(firstBody).toContain("proxies:");
    expect(cachedBody).toBe(firstBody);

    await testEnv.KV.put(cacheKey, "cached-clash-body");

    const secondResponse = await fetchSubscription(fixture.path, "clash");

    expect(await secondResponse.text()).toBe("cached-clash-body");
  });

  it("validates disabled, expired and profile-disabled tokens before reading KV", async () => {
    const disabled = await seedSubscriptionFixture({ enabled: false });
    const expired = await seedSubscriptionFixture({ expiresAt: "2000-01-01 00:00:00" });
    const profileDisabled = await seedSubscriptionFixture({ profileEnabled: false });

    await testEnv.KV.put(generatedSubscriptionCacheKey("plain", disabled.path), "disabled-cache");
    await testEnv.KV.put(generatedSubscriptionCacheKey("plain", expired.path), "expired-cache");
    await testEnv.KV.put(generatedSubscriptionCacheKey("plain", profileDisabled.path), "profile-disabled-cache");

    expect(await (await fetchSubscription(disabled.path, "plain", 404)).text()).toBe("Subscription token not found");
    expect(await (await fetchSubscription(expired.path, "plain", 404)).text()).toBe("Subscription token not found");
    expect(await (await fetchSubscription(profileDisabled.path, "plain", 404)).text()).toBe("Subscription profile not available");
  });

  it("records access logs and last_used_at for generated and cached responses", async () => {
    const fixture = await seedSubscriptionFixture();

    expect(await accessLogCount(fixture.tokenId)).toBe(0);
    expect(await tokenLastUsedAt(fixture.tokenId)).toBeNull();

    await fetchSubscription(fixture.path, "plain");

    expect(await waitForAccessLogCount(fixture.tokenId, 1)).toBe(1);
    expect(await tokenLastUsedAt(fixture.tokenId)).not.toBeNull();

    await fetchSubscription(fixture.path, "plain");

    expect(await waitForAccessLogCount(fixture.tokenId, 2)).toBe(2);
  });
});

import { SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { generatedSubscriptionCacheKey } from "../../apps/worker/src/modules/subscribe/subscribe-cache";
import { ensureSubscriptionSchema, seedSubscriptionFixture, testEnv } from "./subscribe-fixtures";

const adminJsonHeaders = {
  Authorization: "Bearer secret",
  "Content-Type": "application/json"
};

beforeAll(async () => {
  await ensureSubscriptionSchema();
});

describe("subscription cache invalidation", () => {
  it("clears generated subscription caches when a node changes", async () => {
    const fixture = await seedSubscriptionFixture();
    const cacheKey = generatedSubscriptionCacheKey("clash", fixture.path);

    await testEnv.KV.put(cacheKey, "stale-node-cache");

    const response = await patchJson(`/api/nodes/${fixture.nodeIds.ss}`, {
      name: "HK Updated"
    });

    expect(response.status).toBe(200);
    expect(await testEnv.KV.get(cacheKey)).toBeNull();
  });

  it("clears generated subscription caches when a profile rule changes", async () => {
    const fixture = await seedSubscriptionFixture();
    const cacheKey = generatedSubscriptionCacheKey("sing-box", fixture.path);

    await testEnv.KV.put(cacheKey, "stale-profile-cache");

    const response = await postJson(`/api/profiles/${fixture.profileId}/rules`, {
      content: {},
      enabled: true,
      format: "common",
      rule: "DOMAIN-SUFFIX,profile-cache.example,DIRECT"
    });

    expect(response.status).toBe(201);
    expect(await testEnv.KV.get(cacheKey)).toBeNull();
  });

  it("clears generated subscription caches when a profile module changes", async () => {
    const fixture = await seedSubscriptionFixture();
    const cacheKey = generatedSubscriptionCacheKey("xray", fixture.path);

    await testEnv.KV.put(cacheKey, "stale-module-cache");

    const response = await patchJson(`/api/profile-modules/${fixture.moduleIds.xrayDns}`, {
      content: {
        queryStrategy: "UseIPv6",
        servers: ["https://dns-v6.example/dns-query"]
      }
    });

    expect(response.status).toBe(200);
    expect(await testEnv.KV.get(cacheKey)).toBeNull();
  });

  it("clears old and new generated subscription caches when token path changes", async () => {
    const fixture = await seedSubscriptionFixture();
    const oldCacheKey = generatedSubscriptionCacheKey("plain", fixture.path);
    const nextPath = `next-${fixture.path}`;
    const nextCacheKey = generatedSubscriptionCacheKey("plain", nextPath);

    await testEnv.KV.put(oldCacheKey, "old-path-cache");
    await testEnv.KV.put(nextCacheKey, "new-path-cache");

    const response = await patchJson(`/api/tokens/${fixture.tokenId}`, {
      custom_path: nextPath
    });

    expect(response.status).toBe(200);
    expect(await testEnv.KV.get(oldCacheKey)).toBeNull();
    expect(await testEnv.KV.get(nextCacheKey)).toBeNull();
  });

  it("clears generated subscription caches when a source changes", async () => {
    const fixture = await seedSubscriptionFixture();
    const cacheKey = generatedSubscriptionCacheKey("base64", fixture.path);
    const source = await createSource();

    await testEnv.KV.put(cacheKey, "stale-source-cache");

    const response = await patchJson(`/api/sources/${source.id}`, {
      name: "Source Updated"
    });

    expect(response.status).toBe(200);
    expect(await testEnv.KV.get(cacheKey)).toBeNull();
  });

  it("clears token and custom path caches when a token is reset", async () => {
    const fixture = await seedSubscriptionFixture();
    const tokenCacheKey = generatedSubscriptionCacheKey("clash", fixture.token);
    const pathCacheKey = generatedSubscriptionCacheKey("clash", fixture.path);

    await testEnv.KV.put(tokenCacheKey, "old-token-cache");
    await testEnv.KV.put(pathCacheKey, "old-path-cache");

    const response = await postJson(`/api/tokens/${fixture.tokenId}/reset`, {});

    expect(response.status).toBe(200);
    expect(await testEnv.KV.get(tokenCacheKey)).toBeNull();
    expect(await testEnv.KV.get(pathCacheKey)).toBeNull();
  });
});

async function patchJson(path: string, body: unknown) {
  return fetchJson(path, "PATCH", body);
}

async function postJson(path: string, body: unknown) {
  return fetchJson(path, "POST", body);
}

async function createSource() {
  const response = await postJson("/api/sources", {
    enabled: true,
    groups: [],
    name: `Source ${crypto.randomUUID()}`,
    url: "https://example.com/sub.txt"
  });
  const payload = await response.json() as { data: { id: string } };

  expect(response.status).toBe(201);
  return payload.data;
}

function fetchJson(path: string, method: "PATCH" | "POST", body: unknown) {
  return SELF.fetch(`https://example.com${path}`, {
    method,
    headers: adminJsonHeaders,
    body: JSON.stringify(body)
  });
}

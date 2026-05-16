import { describe, expect, it } from "vitest";
import {
  deleteGeneratedSubscriptionCache,
  deleteGeneratedSubscriptionCacheKeys,
  generatedSubscriptionCacheKey
} from "../../../apps/worker/src/modules/subscribe/subscribe-cache";

describe("subscription cache helper", () => {
  it("builds stable cache keys for every generated format", () => {
    expect(generatedSubscriptionCacheKey("clash", "token-a")).toBe("generated_sub:clash:token-a");
    expect(generatedSubscriptionCacheKey("sing-box", "token-a")).toBe("generated_sub:sing-box:token-a");
    expect(generatedSubscriptionCacheKey("xray", "token-a")).toBe("generated_sub:xray:token-a");
  });

  it("deletes all generated formats for one subscription path", async () => {
    const deletedKeys: string[] = [];

    await deleteGeneratedSubscriptionCache(fakeKv(deletedKeys), "token-a");

    expect(deletedKeys).toEqual([
      "generated_sub:clash:token-a",
      "generated_sub:v2rayn:token-a",
      "generated_sub:plain:token-a",
      "generated_sub:sing-box:token-a",
      "generated_sub:xray:token-a"
    ]);
  });

  it("deduplicates subscription paths before deleting caches", async () => {
    const deletedKeys: string[] = [];

    await deleteGeneratedSubscriptionCacheKeys(fakeKv(deletedKeys), ["token-a", null, "token-a", "custom-a"]);

    expect(deletedKeys.filter((key) => key.endsWith(":token-a"))).toHaveLength(5);
    expect(deletedKeys.filter((key) => key.endsWith(":custom-a"))).toHaveLength(5);
  });
});

function fakeKv(deletedKeys: string[]) {
  return {
    delete: async (key: string) => {
      deletedKeys.push(key);
    }
  } as Pick<KVNamespace, "delete"> as KVNamespace;
}

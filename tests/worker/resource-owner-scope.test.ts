import { SELF } from "cloudflare:test";
import { beforeAll, describe, expect, it } from "vitest";
import { createUserAndLogin, ensureResourceSchema, getJson, postJson, postRawJson } from "./resource-fixtures";

beforeAll(async () => {
  await ensureResourceSchema();
});

describe("resource owner scope", () => {
  it("hides another user's sources and dashboard totals", async () => {
    const suffix = crypto.randomUUID();
    const ownerToken = await createUserAndLogin(`owner-${suffix}@example.com`);
    const otherToken = await createUserAndLogin(`other-${suffix}@example.com`);
    const source = await postJson<{ id: string }>(ownerToken, "/api/sources", {
      enabled: true,
      name: "Owner source",
      url: "https://example.com/sub.txt"
    });

    const otherSources = await getJson<{ items: Array<{ id: string }> }>(otherToken, "/api/sources");
    const ownerDashboard = await getJson<{ totals: { sources: number } }>(ownerToken, "/api/dashboard");
    const otherDashboard = await getJson<{ totals: { sources: number } }>(otherToken, "/api/dashboard");
    const blockedPatch = await SELF.fetch(`https://example.com/api/sources/${source.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${otherToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Blocked source" })
    });

    expect(otherSources.items).toEqual([]);
    expect(ownerDashboard.totals.sources).toBe(1);
    expect(otherDashboard.totals.sources).toBe(0);
    expect(blockedPatch.status).toBe(404);
  });

  it("blocks binding a token to another user's profile", async () => {
    const suffix = crypto.randomUUID();
    const ownerToken = await createUserAndLogin(`profile-owner-${suffix}@example.com`);
    const otherToken = await createUserAndLogin(`profile-other-${suffix}@example.com`);
    const profile = await postJson<{ id: string }>(ownerToken, "/api/profiles", {
      default_strategy: "Proxy",
      enabled: true,
      name: "Owner profile"
    });
    const response = await postRawJson(otherToken, "/api/tokens", {
      enabled: true,
      name: "Invalid token",
      profile_id: profile.id
    });
    const payload = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("PROFILE_NOT_FOUND");
  });

  it("blocks binding a token to another user's profile module", async () => {
    const suffix = crypto.randomUUID();
    const ownerToken = await createUserAndLogin(`module-owner-${suffix}@example.com`);
    const otherToken = await createUserAndLogin(`module-other-${suffix}@example.com`);
    const module = await postJson<{ id: string }>(ownerToken, "/api/profile-modules", {
      content: { servers: ["https://owner.example/dns-query"] },
      enabled: true,
      format: "clash",
      is_default: false,
      name: "Owner DNS",
      type: "dns"
    });
    const response = await postRawJson(otherToken, "/api/tokens", {
      enabled: true,
      module_bindings: [{ format: "clash", module_id: module.id, type: "dns" }],
      name: "Invalid module token"
    });
    const payload = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("PROFILE_MODULE_SCOPE_INVALID");
  });
});

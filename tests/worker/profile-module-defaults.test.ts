import { beforeAll, describe, expect, it } from "vitest";
import { createUserAndLogin, ensureResourceSchema, getJson, patchRawJson, postJson } from "./resource-fixtures";

beforeAll(async () => {
  await ensureResourceSchema();
});

describe("profile module defaults", () => {
  it("keeps only one default module per format and type", async () => {
    const suffix = crypto.randomUUID();
    const token = await createUserAndLogin(`module-owner-${suffix}@example.com`);
    const profile = await postJson<{ id: string }>(token, "/api/profiles", {
      default_strategy: "Proxy",
      enabled: true,
      name: "Module profile"
    });
    const first = await postJson<{ id: string; is_default: number; profile_id: string | null }>(token, "/api/profile-modules", {
      content: { servers: ["https://one.example/dns-query"] },
      enabled: true,
      format: "clash",
      is_default: true,
      name: "First DNS",
      profile_id: profile.id,
      type: "dns"
    });
    const second = await postJson<{ id: string; is_default: number; profile_id: string | null }>(token, "/api/profile-modules", {
      content: { servers: ["https://two.example/dns-query"] },
      enabled: true,
      format: "clash",
      is_default: true,
      name: "Second DNS",
      profile_id: profile.id,
      type: "dns"
    });
    const modules = await getJson<{ items: Array<{ id: string; is_default: number; profile_id: string | null }> }>(token, "/api/profile-modules");
    const firstAfter = modules.items.find((module) => module.id === first.id);
    const secondAfter = modules.items.find((module) => module.id === second.id);

    expect(first.profile_id).toBeNull();
    expect(second.profile_id).toBeNull();
    expect(firstAfter?.is_default).toBe(0);
    expect(secondAfter?.is_default).toBe(1);
    expect(secondAfter?.profile_id).toBeNull();
  });

  it("detaches a module from its profile when setting it as default", async () => {
    const suffix = crypto.randomUUID();
    const token = await createUserAndLogin(`module-update-${suffix}@example.com`);
    const profile = await postJson<{ id: string }>(token, "/api/profiles", {
      default_strategy: "Proxy",
      enabled: true,
      name: "Module update profile"
    });
    const module = await postJson<{ id: string; is_default: number; profile_id: string | null }>(token, "/api/profile-modules", {
      content: { servers: ["https://profile.example/dns-query"] },
      enabled: true,
      format: "sing-box",
      is_default: false,
      name: "Profile DNS",
      profile_id: profile.id,
      type: "dns"
    });
    const response = await patchRawJson(token, `/api/profile-modules/${module.id}`, {
      is_default: true,
      profile_id: profile.id
    });
    const payload = (await response.json()) as { data: { is_default: number; profile_id: string | null } };

    expect(response.status).toBe(200);
    expect(module.profile_id).toBe(profile.id);
    expect(payload.data.is_default).toBe(1);
    expect(payload.data.profile_id).toBeNull();
  });
});

import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("worker runtime", () => {
  it("serves health from the Workers runtime", async () => {
    const response = await SELF.fetch("https://example.com/api/health");
    const payload = (await response.json()) as { ok: boolean; data: { authRequired: boolean; env: string; status: string } };

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      data: expect.objectContaining({
        authRequired: true,
        env: "test",
        status: "ok"
      })
    });
  });

  it("serves public site settings and protects updates", async () => {
    const publicResponse = await SELF.fetch("https://example.com/api/site-settings");
    const publicPayload = (await publicResponse.json()) as { ok: boolean; data: { siteSubtitle: string } };

    expect(publicResponse.status).toBe(200);
    expect(publicPayload.data.siteSubtitle).toBe("多格式订阅管理");

    const blockedResponse = await SELF.fetch("https://example.com/api/site-settings", { method: "PATCH" });

    expect(blockedResponse.status).toBe(401);
  });

  it("updates site settings with the admin token", async () => {
    const response = await SELF.fetch("https://example.com/api/site-settings", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer secret",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ siteName: "自定义订阅台", titleImageUrl: "https://example.com/logo.png" })
    });
    const payload = (await response.json()) as { ok: boolean; data: { siteName: string; titleImageUrl: string } };

    expect(response.status).toBe(200);
    expect(payload.data).toEqual(expect.objectContaining({ siteName: "自定义订阅台", titleImageUrl: "https://example.com/logo.png" }));
  });

  it("rejects management API requests without the admin token", async () => {
    const response = await SELF.fetch("https://example.com/api/dashboard");
    const payload = (await response.json()) as { ok: boolean; error: { code: string } };

    expect(response.status).toBe(401);
    expect(payload).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "UNAUTHORIZED" })
    });
  });
});

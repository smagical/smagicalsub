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

import type { Page } from "@playwright/test";

type MockOptions = {
  authRequired?: boolean;
  onDashboardRequest?: (authorization: string) => void;
};

export async function mockApi(page: Page, options: MockOptions = {}) {
  await page.route("**/api/**", (route) =>
    route.fulfill({
      contentType: "application/json",
      json: apiResponse(route.request().url(), route.request().headers().authorization ?? "", options)
    })
  );
}

function apiResponse(url: string, authorization: string, options: MockOptions) {
  if (url.endsWith("/api/health")) {
    return ok({
      authRequired: options.authRequired ?? false,
      env: "e2e",
      status: "ok",
      timestamp: new Date("2026-05-01T00:00:00.000Z").toISOString()
    });
  }

  if (url.endsWith("/api/auth/status")) {
    return ok({
      authRequired: options.authRequired ?? false,
      bootstrapRequired: false,
      bootstrapRequiresToken: false
    });
  }

  if (url.endsWith("/api/auth/login")) {
    return ok({
      expiresAt: "2026-06-01 00:00:00",
      token: "sess_e2e",
      user: { email: "admin@example.com", id: "user_admin", name: "Admin", role: "admin" }
    });
  }

  if (url.endsWith("/api/auth/me")) {
    return ok({ email: "admin@example.com", id: "user_admin", name: "Admin", role: "admin" });
  }

  if (url.endsWith("/api/auth/sessions")) {
    return ok({
      items: [
        {
          created_at: "2026-05-01 00:00:00",
          current: true,
          expires_at: "2026-06-01 00:00:00",
          id: "session_current"
        },
        {
          created_at: "2026-05-01 01:00:00",
          current: false,
          expires_at: "2026-06-01 01:00:00",
          id: "session_other"
        }
      ]
    });
  }

  if (url.endsWith("/api/dashboard")) {
    options.onDashboardRequest?.(authorization);
    return ok({
      totals: { nodes: 0, profiles: 0, sources: 0, tokens: 0 },
      recentEvents: []
    });
  }

  if (url.endsWith("/api/site-settings")) {
    return ok({
      loginDescription: "使用管理员或用户账号登录控制台。",
      loginTitle: "管理员访问",
      siteName: "测试订阅台",
      siteSubtitle: "多格式订阅管理",
      titleImageUrl: null
    });
  }

  if (url.endsWith("/api/users")) {
    return ok({
      items: [
        {
          created_at: "2026-05-01 00:00:00",
          email: "admin@example.com",
          id: "user_admin",
          name: "Admin",
          role: "admin",
          updated_at: "2026-05-01 00:00:00"
        }
      ]
    });
  }

  return ok({ items: [] });
}

function ok(data: unknown) {
  return { ok: true, data };
}

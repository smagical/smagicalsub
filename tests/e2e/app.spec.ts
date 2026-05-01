import { expect, test, type Page } from "@playwright/test";

test("renders the dashboard and navigates between modules", async ({ page }) => {
  await mockApi(page);

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "订阅管理控制台" })).toBeVisible();
  await expect(page.getByText("Cloudflare Workers")).toBeVisible();

  await page.getByRole("button", { name: "切换主题" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "切换主题" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.getByRole("button", { exact: true, name: "节点" }).click();
  await expect(page.getByText("添加单个节点，按分组查看订阅源解析和手动维护的节点。")).toBeVisible();
  await expect(page.getByRole("button", { name: "添加节点" })).toBeVisible();
});

test("logs in and sends the session token with API requests", async ({ page }) => {
  let dashboardAuthorization = "";
  await mockApi(page, {
    authRequired: true,
    onDashboardRequest: (authorization) => {
      dashboardAuthorization = authorization;
    }
  });

  await page.goto("/");
  await expect(page.getByText("管理员访问")).toBeVisible();
  await expect(page.getByText("多格式输出")).toBeVisible();

  await page.getByLabel("邮箱").fill("admin@example.com");
  await page.getByLabel("密码").fill("password123");
  await page.getByRole("button", { name: "进入控制台" }).click();

  await expect(page.getByRole("heading", { name: "订阅管理控制台" })).toBeVisible();
  await page.getByRole("button", { exact: true, name: "用户" }).click();
  await expect(page.getByText("创建后台用户、调整角色，并为用户重置登录密码。")).toBeVisible();
  expect(dashboardAuthorization).toBe("Bearer sess_e2e");
});

type MockOptions = {
  authRequired?: boolean;
  onDashboardRequest?: (authorization: string) => void;
};

async function mockApi(page: Page, options: MockOptions = {}) {
  await page.route("**/api/**", (route) =>
    route.fulfill({
      contentType: "application/json",
      json: apiResponse(route.request().url(), route.request().headers().authorization ?? "", options)
    })
  );
}

function apiResponse(url: string, authorization: string, options: MockOptions) {
  if (url.endsWith("/api/health")) {
    return {
      ok: true,
      data: {
        authRequired: options.authRequired ?? false,
        env: "e2e",
        status: "ok",
        timestamp: new Date("2026-05-01T00:00:00.000Z").toISOString()
      }
    };
  }

  if (url.endsWith("/api/auth/status")) {
    return {
      ok: true,
      data: {
        authRequired: options.authRequired ?? false,
        bootstrapRequired: false,
        bootstrapRequiresToken: false
      }
    };
  }

  if (url.endsWith("/api/auth/login")) {
    return {
      ok: true,
      data: {
        expiresAt: "2026-06-01 00:00:00",
        token: "sess_e2e",
        user: { email: "admin@example.com", id: "user_admin", name: "Admin", role: "admin" }
      }
    };
  }

  if (url.endsWith("/api/auth/me")) {
    return {
      ok: true,
      data: { email: "admin@example.com", id: "user_admin", name: "Admin", role: "admin" }
    };
  }

  if (url.endsWith("/api/dashboard")) {
    options.onDashboardRequest?.(authorization);
    return {
      ok: true,
      data: {
        totals: { nodes: 0, profiles: 0, sources: 0, tokens: 0 },
        recentEvents: []
      }
    };
  }

  if (url.endsWith("/api/site-settings")) {
    return {
      ok: true,
      data: {
        loginDescription: "使用管理员或用户账号登录控制台。",
        loginTitle: "管理员访问",
        siteName: "测试订阅台",
        siteSubtitle: "多格式订阅管理",
        titleImageUrl: null
      }
    };
  }

  if (url.endsWith("/api/users")) {
    return {
      ok: true,
      data: {
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
      }
    };
  }

  return { ok: true, data: { items: [] } };
}

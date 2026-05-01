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

  await page.getByRole("button", { exact: true, name: "设置" }).click();
  await expect(page.getByText("动态设置控制台名称、副标题、标题图片和登录页文案。")).toBeVisible();
});

test("stores the admin token and sends it with API requests", async ({ page }) => {
  let dashboardAuthorization = "";
  await mockApi(page, {
    authRequired: true,
    onDashboardRequest: (authorization) => {
      dashboardAuthorization = authorization;
    }
  });

  await page.goto("/");
  await expect(page.getByText("管理员访问")).toBeVisible();

  await page.getByLabel("管理员令牌").fill("secret");
  await page.getByRole("button", { name: "进入控制台" }).click();

  await expect(page.getByRole("heading", { name: "订阅管理控制台" })).toBeVisible();
  expect(dashboardAuthorization).toBe("Bearer secret");
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
        loginDescription: "输入管理员令牌。",
        loginTitle: "管理员访问",
        siteName: "测试订阅台",
        siteSubtitle: "多格式订阅管理",
        titleImageUrl: null
      }
    };
  }

  return { ok: true, data: { items: [] } };
}

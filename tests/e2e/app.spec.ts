import { expect, test } from "@playwright/test";
import { mockApi } from "./mock-api";

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
  await page.getByRole("button", { exact: true, name: "设置" }).click();
  await expect(page.getByText("账号安全")).toBeVisible();
  await expect(page.getByRole("heading", { name: "登录会话" })).toBeVisible();
  await expect(page.getByText("当前会话")).toBeVisible();
  expect(dashboardAuthorization).toBe("Bearer sess_e2e");
});

test("builds profile rules from structured fields", async ({ page }) => {
  await mockApi(page);

  await page.goto("/");
  await page.getByRole("button", { exact: true, name: "配置档" }).click();
  await page.getByRole("button", { exact: true, name: "规则" }).click();

  await expect(page.getByText("常用模板")).toBeVisible();
  await page.getByLabel("规则类型").selectOption("DOMAIN-KEYWORD");
  await page.getByLabel("匹配值").fill("youtube");
  await page.getByRole("textbox", { exact: true, name: "策略" }).fill("Media");

  await expect(page.getByRole("textbox", { exact: true, name: "规则" })).toHaveValue("DOMAIN-KEYWORD,youtube,Media");
});

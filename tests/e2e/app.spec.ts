import { expect, test, type Download, type Locator } from "@playwright/test";
import { mockApi } from "./mock-api";

test("renders the dashboard and navigates between modules", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          window.__clipboardText = text;
        }
      }
    });
  });
  await mockApi(page);

  await page.goto("/");

  await expect(page.locator("header").getByText("控制面板", { exact: true })).toBeVisible();
  await expect(page.locator("header").getByText("Cloudflare Workers / D1 / KV", { exact: true })).toBeVisible();
  await expect(page.getByText("工作流和请求统计")).toBeVisible();
  await expect(page.getByLabel("请求趋势图表")).toBeVisible();
  await expect(page.getByText("总请求")).toBeVisible();

  await page.getByRole("button", { name: "切换主题" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "切换主题" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.getByRole("button", { exact: true, name: "订阅源" }).click();
  await expect(page.locator('[aria-label="订阅源列表"]')).toBeVisible();
  await expectSelectValue(page.getByRole("combobox", { name: "订阅分页每页数量" }), "10");
  await expect(page.getByLabel("订阅分页跳转页码")).toBeVisible();
  await page.getByLabel("订阅分页跳转页码").fill("2");
  await clickPaginationJump(page.getByLabel("订阅分页跳转页码"));
  await expect(page.getByText("第 2 / 2 页")).toBeVisible();
  await expect(page.getByText("补充订阅源 9")).toBeVisible();
  await chooseSelectOption(page.getByRole("combobox", { name: "订阅分页每页数量" }), "50");
  await expectSelectValue(page.getByRole("combobox", { name: "订阅分页每页数量" }), "50");
  await expect(page.getByText("主力订阅源")).toBeVisible();
  await expect(page.getByText("备用订阅源")).toBeVisible();
  await expectSourceCreateFormSingleRow(page.getByPlaceholder("我的订阅").locator("xpath=ancestor::form"));
  const sourceGroupInput = page.getByPlaceholder("回车添加分组").first();
  await sourceGroupInput.fill("Proxy");
  await sourceGroupInput.press("Enter");
  await sourceGroupInput.fill("Media");
  await sourceGroupInput.press("Enter");
  await expect(page.getByRole("button", { name: "删除分组 Proxy" })).toBeVisible();
  await expect(page.getByRole("button", { name: "删除分组 Media" })).toBeVisible();

  await page.getByRole("button", { exact: true, name: "节点" }).click();
  await expect(page.getByText("添加单个节点，按分组查看订阅源解析和手动维护的节点。")).toBeVisible();
  await expect(page.locator("header").getByText("控制面板", { exact: true })).toBeHidden();
  await expect(page.getByRole("button", { name: "添加节点" })).toBeVisible();
  await expectSelectValue(page.getByRole("combobox", { name: "节点分页每页数量" }), "10");
  await expect(page.getByLabel("节点分页跳转页码")).toBeVisible();
  await page.getByLabel("节点分页跳转页码").fill("2");
  await clickPaginationJump(page.getByLabel("节点分页跳转页码"));
  await expect(page.getByText("第 2 / 2 页")).toBeVisible();
  await chooseSelectOption(page.getByRole("combobox", { name: "节点分页每页数量" }), "70");
  await expectSelectValue(page.getByRole("combobox", { name: "节点分页每页数量" }), "70");
  await chooseSelectOption(page.getByRole("combobox", { name: "协议筛选" }), "vless");
  await expect(page.locator('[aria-label="节点 手动节点"]')).toBeVisible();
  await expect(page.locator('[aria-label="节点 订阅源节点"]')).toBeHidden();
  await page.locator('[aria-label="节点 手动节点"]').getByRole("button", { name: "复制分组" }).click();
  await expect(page.getByText("节点内容已复制")).toBeVisible();
  await expect(page.locator('[role="status"]').filter({ hasText: "已复制" })).toBeVisible();
  expect(await page.evaluate(() => window.__clipboardText)).toBe("无分组");
  await page.getByRole("button", { exact: true, name: "编辑" }).click();
  const editDialog = page.getByRole("dialog", { name: "编辑节点" });
  await expect(editDialog).toBeVisible();
  await expect(editDialog.getByLabel("节点链接")).toContainText("vless://");
  await expect(editDialog.getByLabel("高级参数 JSON")).toContainText('"server": "manual.example.com"');
  const editGroupInput = editDialog.getByPlaceholder("回车添加分组");
  await editGroupInput.fill("Proxy");
  await editGroupInput.press("Enter");
  await editGroupInput.fill("Media");
  await editGroupInput.press("Enter");
  await expect(editDialog.getByRole("button", { name: "删除分组 Proxy" })).toBeVisible();
  await expect(editDialog.getByRole("button", { name: "删除分组 Media" })).toBeVisible();
  await page.getByRole("button", { exact: true, name: "取消" }).click();
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

  await expect(page.locator("header").getByText("控制面板", { exact: true })).toBeVisible();
  await page.getByRole("button", { exact: true, name: "用户" }).click();
  await expect(page.getByText("创建后台用户、调整角色，并为用户重置登录密码。")).toBeVisible();
  await expect(page.getByText("受保护")).toBeVisible();
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
  await expect(page.getByText("配置档与规则编排")).toBeVisible();
  await expect(page.getByText("新建配置档")).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "搜索配置档" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "配置档列表" })).toBeVisible();
  await expectSelectValue(page.getByRole("combobox", { name: "配置档分页每页数量" }), "10");
  await expect(page.getByLabel("配置档分页跳转页码")).toBeVisible();
  await page.getByLabel("配置档分页跳转页码").fill("2");
  await clickPaginationJump(page.getByLabel("配置档分页跳转页码"));
  await expect(page.getByText("第 2 / 2 页")).toBeVisible();
  await expect(page.getByText("扩展配置 10")).toBeVisible();
  await chooseSelectOption(page.getByRole("combobox", { name: "配置档分页每页数量" }), "30");
  await expectSelectValue(page.getByRole("combobox", { name: "配置档分页每页数量" }), "30");
  await expectSelectValue(page.getByRole("combobox", { name: "默认 模块每页数量" }), "5");
  await expect(page.getByLabel("默认 模块跳转页码")).toBeVisible();
  await page.getByLabel("默认 模块跳转页码").fill("2");
  await clickPaginationJump(page.getByLabel("默认 模块跳转页码"));
  await expect(page.getByText("默认 DNS 模块 8")).toBeVisible();
  await chooseSelectOption(page.getByRole("combobox", { name: "默认 模块每页数量" }), "20");
  await expectSelectValue(page.getByRole("combobox", { name: "默认 模块每页数量" }), "20");
  await expect(page.getByText("默认 DNS 模块 1")).toBeVisible();
  await expect(page.getByText("默认 DNS 模块 8")).toBeVisible();

  const defaultProfileRow = page.getByRole("row").filter({ hasText: "默认配置" }).first();

  await defaultProfileRow.getByRole("button", { exact: true, name: "编辑" }).click();
  const editProfileDialog = page.getByRole("dialog", { name: "编辑配置档" });
  await expect(editProfileDialog).toBeVisible();
  await expect(editProfileDialog.getByLabel("配置档名称")).toHaveValue("默认配置");
  await expect(editProfileDialog.getByLabel("默认策略")).toHaveValue("Proxy");
  await editProfileDialog.getByRole("button", { name: "取消" }).click();
  await expect(editProfileDialog).toBeHidden();

  await defaultProfileRow.getByRole("button", { exact: true, name: "规则" }).click();

  const rulesDialog = page.getByRole("dialog", { name: "规则编排" });
  await expect(rulesDialog).toBeVisible();
  const rulesPanel = rulesDialog.getByRole("region", { name: "默认配置的规则面板" });
  await expect(rulesPanel).toBeVisible();
  await expect(rulesPanel.getByText("规则编排")).toBeVisible();
  await expect(rulesPanel.getByText("规则总数")).toBeVisible();
  await expect(rulesPanel.getByText("启用规则")).toBeVisible();
  await expect(rulesPanel.getByText("停用规则")).toBeVisible();
  await expect(rulesDialog.getByText("常用模板")).toBeVisible();
  await chooseSelectOption(rulesDialog.getByRole("combobox", { name: "规则类型" }), "关键词");
  await rulesDialog.getByRole("textbox", { exact: true, name: "匹配值" }).fill("youtube");
  await rulesDialog.getByRole("checkbox", { name: "自定义策略" }).click();
  await rulesDialog.getByLabel("自定义策略值").fill("Media");

  await expect(rulesDialog.getByRole("textbox", { exact: true, name: "规则" })).toHaveValue("DOMAIN-KEYWORD,youtube,Media");

  await chooseSelectOption(rulesDialog.getByRole("combobox", { name: "规则类型" }), "地理 IP");
  await rulesDialog.getByRole("textbox", { exact: true, name: "匹配值" }).fill("CN");
  await rulesDialog.getByRole("checkbox", { name: "自定义策略" }).click();
  await chooseSelectOption(rulesDialog.getByRole("combobox", { name: "策略" }), "DIRECT（直连）");

  await expect(rulesDialog.getByRole("textbox", { exact: true, name: "规则" })).toHaveValue("GEOIP,CN,DIRECT");
});

test("shows subscription output center for tokens", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          window.__clipboardText = text;
        }
      }
    });
  });
  await mockApi(page);

  await page.goto("/");
  await page.getByRole("button", { exact: true, name: "令牌" }).click();
  const outputCenter = page.getByRole("region", { name: "订阅输出中心" });

  await expect(outputCenter).toBeVisible();
  await expect(outputCenter.getByText("/sub/primary-sub?format=clash")).toBeVisible();
  await expect(outputCenter.getByText("启用节点数", { exact: true })).toBeVisible();
  await expect(outputCenter.getByText("节点分组数", { exact: true })).toBeVisible();
  await expect(outputCenter.getByText("启用规则数", { exact: true })).toBeVisible();
  await expect(outputCenter.getByText("手动 1 / 订阅源 0")).toBeVisible();
  await expect(outputCenter.getByText("输出状态正常")).toBeVisible();
  await chooseSelectOption(page.getByRole("combobox", { name: "输出令牌" }), "备用订阅");
  await expect(outputCenter.getByText("/sub/tok_e2e_backup?format=clash")).toBeVisible();
  await expect(outputCenter.getByText("令牌已停用，订阅请求会被拒绝")).toBeVisible();
  await chooseSelectOption(outputCenter.getByRole("combobox", { name: "输出格式" }), "sing-box JSON");

  await expect(outputCenter.getByText("/sub/tok_e2e_backup?format=sing-box")).toBeVisible();
  await expect(outputCenter.getByText("Clash YAML")).toBeVisible();
  await expectSelectValue(outputCenter.getByRole("combobox", { name: "输出格式" }), "sing-box JSON");
  await expect(outputCenter.getByText("Xray JSON")).toBeVisible();
  await outputCenter.getByRole("button", { name: "健康检查" }).click();
  await expect(outputCenter.getByText("HTTP 200")).toBeVisible();
  await expect(outputCenter.getByText("sing-box JSON 格式正常")).toBeVisible();
  await expect(page.getByText("订阅健康检查通过")).toBeVisible();
  await outputCenter.getByRole("button", { name: "复制全部格式" }).click();

  const clipboardText = await page.evaluate(() => window.__clipboardText);
  expect(clipboardText).toContain("Clash YAML: http://127.0.0.1:4173/sub/tok_e2e_backup?format=clash");
  expect(clipboardText).toContain("Base64: http://127.0.0.1:4173/sub/tok_e2e_backup?format=v2rayn");
  expect(clipboardText).toContain("sing-box JSON: http://127.0.0.1:4173/sub/tok_e2e_backup?format=sing-box");
  expect(clipboardText).toContain("Xray JSON: http://127.0.0.1:4173/sub/tok_e2e_backup?format=xray");
  await expect(page.getByText("全部格式订阅地址已复制")).toBeVisible();

  await outputCenter.getByRole("button", { name: "加载预览" }).click();

  await expect(outputCenter.getByText('"type": "selector"')).toBeVisible();
  await expect(outputCenter.getByText(".json", { exact: true })).toBeVisible();

  const download = page.waitForEvent("download");
  await outputCenter.getByRole("button", { name: "下载预览" }).click();
  const previewDownload = await download;
  expect(previewDownload.suggestedFilename()).toMatch(/^subscription-tok_e2e_backup-sing-box-\d{4}-\d{2}-\d{2}\.json$/);
  expect(await previewDownloadText(previewDownload)).toContain('"type": "selector"');

  await outputCenter.getByRole("button", { name: "复制内容" }).click();
  await expect(page.getByText("预览内容已复制")).toBeVisible();
  await outputCenter.getByRole("button", { name: "清空" }).click();
  await expect(outputCenter.getByText('"type": "selector"')).toBeHidden();
});

async function previewDownloadText(download: Download) {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];

  if (!stream) {
    return "";
  }

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function chooseSelectOption(select: Locator, optionName: string) {
  await select.click();
  await select.page().getByRole("option", { name: optionName, exact: true }).click();
}

async function expectSelectValue(select: Locator, value: string) {
  await expect(select).toContainText(value);
}

async function clickPaginationJump(jumpInput: Locator) {
  await jumpInput.locator("xpath=ancestor::form").getByRole("button", { name: "跳转" }).click();
}

async function expectSourceCreateFormSingleRow(form: Locator) {
  await expect(form).toBeVisible();

  // 新增订阅源有 6 个控件，字段增加时必须保持桌面端同一行底部对齐。
  const controls = form.locator(":scope > *");
  await expect(controls).toHaveCount(6);
  const bottoms = await controls.evaluateAll((elements) =>
    elements.map((element) => Math.round(element.getBoundingClientRect().bottom))
  );

  expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThanOrEqual(2);
}

declare global {
  interface Window {
    __clipboardText: string;
  }
}

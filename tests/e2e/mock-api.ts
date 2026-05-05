import type { Page } from "@playwright/test";

type MockOptions = {
  authRequired?: boolean;
  onDashboardRequest?: (authorization: string) => void;
};

export async function mockApi(page: Page, options: MockOptions = {}) {
  await page.route("**/sub/**", (route) =>
    route.fulfill({
      contentType: "text/plain; charset=utf-8",
      body: subscriptionPreview(route.request().url())
    })
  );

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
      user: { email: "admin@example.com", id: "user_admin", name: "Admin", protected: 1, role: "admin" }
    });
  }

  if (url.endsWith("/api/auth/me")) {
    return ok({ email: "admin@example.com", id: "user_admin", name: "Admin", protected: 1, role: "admin" });
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
      requestStats: {
        blocked: 4,
        cached: 31,
        success: 118,
        total: 122,
        trend: [
          { label: "00", value: 12 },
          { label: "04", value: 9 },
          { label: "08", value: 18 },
          { label: "12", value: 27 },
          { label: "16", value: 22 },
          { label: "20", value: 19 },
          { label: "24", value: 15 }
        ]
      },
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
          protected: 1,
          role: "admin",
          updated_at: "2026-05-01 00:00:00"
        }
      ]
    });
  }

  if (url.endsWith("/api/profiles")) {
    return ok({
      items: [
        {
          created_at: "2026-05-01 00:00:00",
          default_strategy: "Proxy",
          description: "用于 E2E 的默认配置档",
          enabled: 1,
          id: "profile_default",
          name: "默认配置",
          owner_id: null,
          updated_at: "2026-05-01 00:00:00"
        }
      ]
    });
  }

  if (url.endsWith("/api/profiles/profile_default/rules")) {
    return ok({
      items: [
        {
          enabled: 1,
          id: "rule_media",
          position: 10,
          profile_id: "profile_default",
          rule: "DOMAIN-SUFFIX,example.com,Proxy"
        },
        {
          enabled: 0,
          id: "rule_disabled",
          position: 20,
          profile_id: "profile_default",
          rule: "DOMAIN-SUFFIX,disabled.example,DIRECT"
        }
      ]
    });
  }

  if (url.endsWith("/api/sources")) {
    return ok({
      items: [
        {
          created_at: "2026-05-01 00:00:00",
          enabled: 1,
          groups: ["Proxy"],
          id: "source_default",
          last_error: null,
          last_fetched_at: "2026-05-01 08:00:00",
          last_status: "success",
          name: "主力订阅源",
          next_refresh_at: "2026-05-01 10:00:00",
          refresh_interval_minutes: 120,
          updated_at: "2026-05-01 08:00:00",
          url: "https://example.com/subscription"
        },
        {
          created_at: "2026-05-01 00:00:00",
          enabled: 0,
          groups: ["Backup"],
          id: "source_backup",
          last_error: "上游暂时不可用",
          last_fetched_at: null,
          last_status: "failed",
          name: "备用订阅源",
          next_refresh_at: null,
          refresh_interval_minutes: 0,
          updated_at: "2026-05-01 00:00:00",
          url: "https://backup.example.com/subscription"
        }
      ]
    });
  }

  if (url.endsWith("/api/nodes")) {
    return ok({
      items: [
        {
          enabled: 1,
          groups: [],
          id: "node_manual",
          name: "手动节点",
          port: 443,
          protocol: "vless",
          server: "manual.example.com",
          source_id: null,
          uri: "vless://00000000-0000-0000-0000-000000000000@manual.example.com:443?security=tls#手动节点",
          config: { type: "vless", server: "manual.example.com", port: 443, uuid: "00000000-0000-0000-0000-000000000000", tls: true },
          updated_at: "2026-05-01 00:00:00"
        },
        {
          enabled: 1,
          groups: ["Proxy"],
          id: "node_source",
          name: "订阅源节点",
          port: 443,
          protocol: "vmess",
          server: "source.example.com",
          source_id: "source_default",
          uri: "vmess://e30=",
          config: { type: "vmess", server: "source.example.com", port: 443 },
          updated_at: "2026-05-01 01:00:00"
        },
        {
          enabled: 0,
          groups: ["Backup"],
          id: "node_disabled",
          name: "停用节点",
          port: 443,
          protocol: "trojan",
          server: "disabled.example.com",
          source_id: null,
          uri: "trojan://password@disabled.example.com:443#停用节点",
          config: { type: "trojan", server: "disabled.example.com", port: 443, password: "password" },
          updated_at: "2026-05-01 02:00:00"
        }
      ]
    });
  }

  if (url.endsWith("/api/tokens")) {
    return ok({
      items: [
        {
          created_at: "2026-05-01 00:00:00",
          enabled: 1,
          expires_at: null,
          id: "token_default",
          last_used_at: null,
          name: "默认订阅",
          owner_id: null,
          profile_id: "profile_default",
          profile_name: "默认配置",
          custom_path: "primary-sub",
          node_ids: ["node_manual"],
          token: "tok_e2e_default"
        },
        {
          created_at: "2026-05-01 02:00:00",
          enabled: 0,
          expires_at: "2026-06-01 00:00:00",
          id: "token_backup",
          last_used_at: "2026-05-02 00:00:00",
          name: "备用订阅",
          owner_id: null,
          profile_id: "profile_default",
          profile_name: "默认配置",
          custom_path: null,
          node_ids: [],
          token: "tok_e2e_backup"
        }
      ]
    });
  }

  return ok({ items: [] });
}

function subscriptionPreview(url: string) {
  if (url.includes("format=sing-box")) {
    return `{
  "outbounds": [{ "type": "selector", "tag": "Proxy" }]
}`;
  }

  if (url.includes("format=v2rayn")) {
    return "dmxlc3M6Ly9leGFtcGxlLmNvbQ==";
  }

  if (url.includes("format=plain")) {
    return "vless://e2e-node@example.com:443?security=tls#e2e-node";
  }

  return "proxies:\n  - name: e2e-node\nproxy-groups:\n  - name: Proxy";
}

function ok(data: unknown) {
  return { ok: true, data };
}

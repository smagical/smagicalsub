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

  if (url.endsWith("/api/setup/status")) {
    return ok({
      available: true,
      bootstrapRequired: true,
      bootstrapRequiresToken: false,
      mode: "auto",
      resources: {
        adminToken: false,
        adminUser: false,
        d1: true,
        kv: true,
        migrations: true
      },
      steps: [
        { key: "d1", label: "D1 绑定", ok: true, required: true, detail: "DB binding 可用" },
        { key: "kv", label: "KV 绑定", ok: true, required: true, detail: "KV binding 可用" },
        { key: "migrations", label: "D1 迁移", ok: true, required: true, detail: "核心数据表已存在" },
        { key: "adminToken", label: "管理员恢复令牌", ok: false, required: false, detail: "可选：未配置时仍可完成初始化，但无法使用密码恢复" },
        { key: "adminUser", label: "首个管理员", ok: false, required: true, detail: "创建首个管理员后初始化完成" }
      ]
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
      items: mockProfiles()
    });
  }

  if (url.endsWith("/api/profile-modules")) {
    return ok({
      items: mockProfileModules()
    });
  }

  if (url.endsWith("/api/profiles/profile_default/rules")) {
    return ok({
      items: [
        {
          content: {},
          enabled: 1,
          format: "common",
          id: "rule_media",
          position: 10,
          profile_id: "profile_default",
          rule: "DOMAIN-SUFFIX,example.com,Proxy"
        },
        {
          content: {},
          enabled: 0,
          format: "common",
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
      items: mockSources()
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
        },
        {
          enabled: 1,
          groups: ["Proxy"],
          id: "node_extra_1",
          name: "额外节点 1",
          port: 80,
          protocol: "vmess",
          server: "extra1.example.com",
          source_id: null,
          uri: "vmess://extra-1",
          config: { type: "vmess", server: "extra1.example.com", port: 80 },
          updated_at: "2026-05-01 03:00:00"
        },
        {
          enabled: 1,
          groups: ["Media"],
          id: "node_extra_2",
          name: "额外节点 2",
          port: 443,
          protocol: "ss",
          server: "extra2.example.com",
          source_id: "source_default",
          uri: "ss://extra-2",
          config: { type: "ss", server: "extra2.example.com", port: 443 },
          updated_at: "2026-05-01 04:00:00"
        },
        {
          enabled: 0,
          groups: ["Backup"],
          id: "node_extra_3",
          name: "额外节点 3",
          port: 443,
          protocol: "hysteria2",
          server: "extra3.example.com",
          source_id: null,
          uri: "hysteria2://extra-3",
          config: { type: "hysteria2", server: "extra3.example.com", port: 443 },
          updated_at: "2026-05-01 05:00:00"
        },
        {
          enabled: 1,
          groups: ["Proxy"],
          id: "node_extra_4",
          name: "额外节点 4",
          port: 8443,
          protocol: "tuic",
          server: "extra4.example.com",
          source_id: null,
          uri: "tuic://extra-4",
          config: { type: "tuic", server: "extra4.example.com", port: 8443 },
          updated_at: "2026-05-01 06:00:00"
        },
        {
          enabled: 1,
          groups: ["Proxy"],
          id: "node_extra_5",
          name: "额外节点 5",
          port: 2080,
          protocol: "socks",
          server: "extra5.example.com",
          source_id: null,
          uri: "socks://extra-5",
          config: { type: "socks", server: "extra5.example.com", port: 2080 },
          updated_at: "2026-05-01 07:00:00"
        },
        {
          enabled: 0,
          groups: ["Backup"],
          id: "node_extra_6",
          name: "额外节点 6",
          port: 8080,
          protocol: "http",
          server: "extra6.example.com",
          source_id: null,
          uri: "http://extra-6",
          config: { type: "http", server: "extra6.example.com", port: 8080 },
          updated_at: "2026-05-01 08:00:00"
        },
        {
          enabled: 1,
          groups: ["Proxy"],
          id: "node_extra_7",
          name: "额外节点 7",
          port: 443,
          protocol: "wireguard",
          server: "extra7.example.com",
          source_id: null,
          uri: "wireguard://extra-7",
          config: {
            type: "wireguard",
            server: "extra7.example.com",
            port: 443,
            "private-key": "extra-private-key",
            "public-key": "extra-public-key",
            ip: "10.7.0.2/32"
          },
          updated_at: "2026-05-01 09:00:00"
        },
        {
          enabled: 1,
          groups: ["Media"],
          id: "node_extra_8",
          name: "额外节点 8",
          port: 443,
          protocol: "vmess",
          server: "extra8.example.com",
          source_id: null,
          uri: "vmess://extra-8",
          config: { type: "vmess", server: "extra8.example.com", port: 443 },
          updated_at: "2026-05-01 10:00:00"
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
          module_bindings: [],
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
          module_bindings: [],
          token: "tok_e2e_backup"
        }
      ]
    });
  }

  return ok({ items: [] });
}

function mockProfiles() {
  const defaultProfile = {
    created_at: "2026-05-01 00:00:00",
    default_strategy: "Proxy",
    description: "用于 E2E 的默认配置档",
    enabled: 1,
    id: "profile_default",
    name: "默认配置",
    owner_id: null,
    updated_at: "2026-05-01 00:00:00"
  };

  // 生成超过默认每页 10 条的数据，确保配置档分页和跳转控件被真实覆盖。
  const extraProfiles = Array.from({ length: 10 }, (_, index) => {
    const sequence = index + 1;
    const day = String(sequence + 1).padStart(2, "0");

    return {
      created_at: `2026-05-${day} 00:00:00`,
      default_strategy: sequence % 2 === 0 ? "DIRECT" : "Proxy",
      description: `用于分页验证的扩展配置档 ${sequence}`,
      enabled: sequence % 3 === 0 ? 0 : 1,
      id: `profile_extra_${sequence}`,
      name: `扩展配置 ${sequence}`,
      owner_id: null,
      updated_at: `2026-05-${day} 08:00:00`
    };
  });

  return [defaultProfile, ...extraProfiles];
}

function mockSources() {
  const primarySource = {
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
  };
  const backupSource = {
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
  };
  const extraSources = Array.from({ length: 9 }, (_, index) => {
    const sequence = index + 1;
    const hour = String(sequence + 8).padStart(2, "0");

    return {
      created_at: "2026-05-01 00:00:00",
      enabled: sequence % 4 === 0 ? 0 : 1,
      groups: sequence % 2 === 0 ? ["Media"] : ["Proxy"],
      id: `source_extra_${sequence}`,
      last_error: null,
      last_fetched_at: `2026-05-01 ${hour}:00:00`,
      last_status: "success",
      name: `补充订阅源 ${sequence}`,
      next_refresh_at: `2026-05-01 ${String(sequence + 10).padStart(2, "0")}:00:00`,
      refresh_interval_minutes: 120,
      updated_at: `2026-05-01 ${hour}:00:00`,
      url: `https://extra${sequence}.example.com/subscription`
    };
  });

  return [primarySource, backupSource, ...extraSources];
}

function mockProfileModules() {
  return Array.from({ length: 8 }, (_, index) => {
    const sequence = index + 1;
    const day = String(sequence).padStart(2, "0");

    return {
      content: {
        enable: true,
        servers: [`https://dns${sequence}.example/dns-query`]
      },
      created_at: `2026-05-${day} 00:00:00`,
      enabled: 1,
      format: "common",
      id: `module_default_${sequence}`,
      is_default: 1,
      name: `默认 DNS 模块 ${sequence}`,
      owner_id: null,
      profile_id: null,
      profile_name: null,
      type: "dns",
      updated_at: `2026-05-${day} 08:00:00`
    };
  });
}

function subscriptionPreview(url: string) {
  if (url.includes("format=sing-box")) {
    return `{
  "outbounds": [{ "type": "selector", "tag": "Proxy" }]
}`;
  }

  if (url.includes("format=xray")) {
    return `{
  "outbounds": [{ "protocol": "freedom", "tag": "direct" }],
  "routing": { "rules": [] }
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

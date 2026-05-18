import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bootstrapAdminSchema, failure, success, type SetupStatusDto } from "@smagicalsub/shared";
import type { AppContext } from "../../env";
import { createSession } from "../auth/session.repository";
import { countUsers, createUser } from "../auth/user.repository";

export const setupRoutes = new Hono<AppContext>();

setupRoutes.get("/status", async (c) => {
  return c.json(success(await setupStatus(c.env)));
});

setupRoutes.post("/bootstrap", zValidator("form", bootstrapAdminSchema), async (c) => {
  const status = await setupStatus(c.env);

  if (!status.available || !status.bootstrapRequired) {
    return c.redirect("/", 302);
  }

  const input = c.req.valid("form");
  const expectedToken = c.env.ADMIN_TOKEN?.trim();

  if (expectedToken && input.bootstrapToken !== expectedToken) {
    return c.json(failure({ code: "UNAUTHORIZED", message: "初始化令牌不正确" }), 401);
  }

  const user = await createUser(c.env.DB, { ...input, role: "admin" }, true);
  if (!user) {
    return c.json(failure({ code: "BOOTSTRAP_FAILED", message: "管理员创建失败" }), 500);
  }

  await createSession(c.env.DB, user.id);
  return c.redirect("/", 302);
});

async function setupStatus(env: AppContext["Bindings"]): Promise<SetupStatusDto> {
  const mode = normalizedSetupMode(env.SETUP_MODE);
  const [d1, kv, migrations, userCount] = await Promise.all([probeD1(env), probeKV(env), probeMigrations(env), safeUserCount(env)]);
  const adminUser = userCount > 0;
  const adminToken = Boolean(env.ADMIN_TOKEN?.trim());
  const bootstrapRequired = migrations && !adminUser;
  const available = mode === "enabled" || (mode === "auto" && bootstrapRequired);

  return {
    available,
    mode,
    resources: {
      adminToken,
      adminUser,
      d1,
      kv,
      migrations
    },
    steps: [
      {
        key: "d1",
        label: "D1 绑定",
        ok: d1,
        required: true,
        detail: d1 ? "DB binding 可用" : "等待 Wrangler automatic provisioning 创建并绑定 DB"
      },
      {
        key: "kv",
        label: "KV 绑定",
        ok: kv,
        required: true,
        detail: kv ? "KV binding 可用" : "等待 Wrangler automatic provisioning 创建并绑定 KV"
      },
      {
        key: "migrations",
        label: "D1 迁移",
        ok: migrations,
        required: true,
        detail: migrations ? "核心数据表已存在" : "等待执行 pnpm db:migrate:remote 或 pnpm deploy:cloudflare"
      },
      {
        key: "adminToken",
        label: "管理员恢复令牌",
        ok: adminToken,
        required: false,
        detail: adminToken ? "ADMIN_TOKEN 已配置" : "可选：未配置时仍可完成初始化，但无法使用密码恢复"
      },
      {
        key: "adminUser",
        label: "首个管理员",
        ok: adminUser,
        required: true,
        detail: adminUser ? "管理员已创建" : "创建首个管理员后初始化完成"
      }
    ],
    bootstrapRequired,
    bootstrapRequiresToken: adminToken
  };
}

function normalizedSetupMode(value: string | undefined): SetupStatusDto["mode"] {
  const normalized = value?.trim().toLowerCase();
  return normalized === "enabled" || normalized === "disabled" ? normalized : "auto";
}

async function probeD1(env: AppContext["Bindings"]) {
  try {
    await env.DB.prepare("SELECT 1").first();
    return true;
  } catch {
    return false;
  }
}

async function probeKV(env: AppContext["Bindings"]) {
  try {
    await env.KV.get("setup:probe");
    return true;
  } catch {
    return false;
  }
}

async function probeMigrations(env: AppContext["Bindings"]) {
  try {
    await env.DB.prepare("SELECT 1 FROM users LIMIT 1").first();
    return true;
  } catch {
    return false;
  }
}

async function safeUserCount(env: AppContext["Bindings"]) {
  try {
    return await countUsers(env.DB);
  } catch {
    return 0;
  }
}

import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bootstrapAdminSchema, failure, success, type SetupStatusDto } from "@smagicalsub/shared";
import type { AppContext } from "../../env";
import { errorDetail, logEvent, requestId } from "../../lib/request-log";
import { createSession } from "../auth/session.repository";
import { countUsers, createUser, deleteUserById } from "../auth/user.repository";

export const setupRoutes = new Hono<AppContext>();
type CreatedUser = Awaited<ReturnType<typeof createUser>>;

const requiredMigrationTables = [
  "users",
  "sessions",
  "subscription_sources",
  "nodes",
  "node_sources",
  "profiles",
  "profile_rules",
  "profile_modules",
  "subscribe_tokens",
  "subscribe_token_modules",
  "refresh_jobs",
  "access_logs",
  "subscription_metrics"
];

setupRoutes.get("/status", async (c) => {
  const status = await setupStatus(c.env);

  logEvent(c, "info", "setup.status", {
    adminUser: status.resources.adminUser,
    available: status.available,
    bootstrapRequired: status.bootstrapRequired,
    d1: status.resources.d1,
    kv: status.resources.kv,
    migrations: status.resources.migrations,
    mode: status.mode,
    requestId: requestId(c)
  });

  return c.json(success(status));
});

setupRoutes.post("/bootstrap", zValidator("form", bootstrapAdminSchema), async (c) => {
  const id = requestId(c);
  const status = await setupStatus(c.env);
  logEvent(c, "info", "setup.bootstrap.start", {
    adminTokenConfigured: status.resources.adminToken,
    bootstrapRequired: status.bootstrapRequired,
    migrationsReady: status.resources.migrations,
    requestId: id,
    setupAvailable: status.available
  });

  if (!status.available || !status.bootstrapRequired) {
    logEvent(c, "warn", "setup.bootstrap.closed", { requestId: id });
    return c.redirect("/", 302);
  }

  if (!setupReadyForBootstrap(status)) {
    logEvent(c, "warn", "setup.bootstrap.not_ready", {
      d1: status.resources.d1,
      kv: status.resources.kv,
      migrations: status.resources.migrations,
      requestId: id
    });
    return c.json(failure({ code: "SETUP_NOT_READY", message: "D1、KV 或 D1 迁移尚未完成，请重新检测后再初始化" }), 409);
  }

  const input = c.req.valid("form");
  const expectedToken = c.env.ADMIN_TOKEN?.trim();

  if (expectedToken && input.bootstrapToken !== expectedToken) {
    logEvent(c, "warn", "setup.bootstrap.invalid_token", { requestId: id });
    return c.json(failure({ code: "UNAUTHORIZED", message: "初始化令牌不正确" }), 401);
  }

  let user: CreatedUser | null = null;

  try {
    logEvent(c, "info", "setup.bootstrap.create_user.start", { requestId: id });
    user = await createUser(c.env.DB, { ...input, role: "admin" }, true);
    if (!user) {
      logEvent(c, "error", "setup.bootstrap.create_user.empty", { requestId: id });
      return c.json(failure({ code: "BOOTSTRAP_FAILED", message: `管理员创建失败，requestId=${id}` }), 500);
    }

    logEvent(c, "info", "setup.bootstrap.create_session.start", { requestId: id, userId: user.id });
    await createSession(c.env.DB, user.id);
    logEvent(c, "info", "setup.bootstrap.success", { requestId: id, userId: user.id });
    return c.redirect("/", 302);
  } catch (error) {
    logEvent(c, "error", "setup.bootstrap.failed", {
      ...errorDetail(error),
      requestId: id,
      userCreated: Boolean(user?.id),
      userId: user?.id
    });

    const createdUser = user;

    if (createdUser?.id) {
      await deleteUserById(c.env.DB, createdUser.id)
        .then(() => logEvent(c, "warn", "setup.bootstrap.cleanup_user.success", { requestId: id, userId: createdUser.id }))
        .catch((cleanupError) =>
          logEvent(c, "error", "setup.bootstrap.cleanup_user.failed", {
            ...errorDetail(cleanupError),
            requestId: id,
            userId: createdUser.id
          })
        );
    }

    return c.json(failure({ code: "BOOTSTRAP_FAILED", message: `管理员初始化失败，请在 Cloudflare 日志中搜索 requestId=${id}` }), 500);
  }
});

export async function setupStatus(env: AppContext["Bindings"]): Promise<SetupStatusDto> {
  const mode = normalizedSetupMode(env.SETUP_MODE);
  const [d1, kv, migrations, userCount] = await Promise.all([probeD1(env), probeKV(env), probeMigrations(env), safeUserCount(env)]);
  const adminUser = userCount > 0;
  const adminToken = Boolean(env.ADMIN_TOKEN?.trim());
  const bootstrapRequired = !adminUser;
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

export function setupReadyForBootstrap(status: SetupStatusDto) {
  return status.resources.d1 && status.resources.kv && status.resources.migrations;
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
    const rows = await env.DB.prepare(
      `SELECT name
       FROM sqlite_master
       WHERE type = 'table'
       AND name IN (${requiredMigrationTables.map((_, index) => `?${index + 1}`).join(", ")})`
    )
      .bind(...requiredMigrationTables)
      .all<{ name: string }>();
    const existingTables = new Set((rows.results ?? []).map((row) => row.name));

    if (!requiredMigrationTables.every((table) => existingTables.has(table))) {
      return false;
    }

    const nodeColumns = await env.DB.prepare(`PRAGMA table_info(nodes)`).all<{ name: string }>();
    const nodeColumnNames = new Set((nodeColumns.results ?? []).map((row) => row.name));

    return nodeColumnNames.has("manual");
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

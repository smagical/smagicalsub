# smagicalsub

运行在 Cloudflare Workers 上的订阅管理 Web 项目，前端使用 React/Vite，后端使用 Hono Worker API，数据层使用 D1 + KV。

## 技术栈

- TypeScript 全栈
- pnpm workspace
- React + Vite
- Tailwind CSS + shadcn/ui
- Cloudflare Workers Static Assets
- Hono
- D1 + KV
- Drizzle schema

## 项目结构

```text
apps/
  web/                 React/Vite 前端、Cloudflare Vite 插件和 wrangler 部署入口
  worker/              Hono Worker API，承载 /api/* 和 /sub/* 后端路由
packages/
  db/                  D1/Drizzle schema
  shared/              前后端共享 DTO、Zod schema 和通用类型
  subscription/        节点 URI 解析、订阅解析、多格式订阅渲染
```

`packages/subscription` 原先命名为 `packages/clash`，但实际职责已经覆盖 Clash YAML、v2rayN Base64、明文 URI 和 sing-box JSON，因此改为更贴近职责的订阅处理包。

前后端通过 `apps/web/wrangler.jsonc` 同时部署到 Cloudflare Workers：静态资源由 Workers Static Assets 托管，`/api/*` 和 `/sub/*` 会先进入 `apps/worker/src/index.ts` 的 Hono 路由。

## 本地开发

```bash
pnpm install
pnpm dev
```

## 认证与权限

管理 API 支持邮箱密码登录和 session token。首次启动时会进入管理员初始化流程；如果配置了 `ADMIN_TOKEN`，初始化首个管理员时必须提交该令牌。

`ADMIN_TOKEN` 仍保留为管理员兜底入口和初始化保护令牌；普通用户通过登录接口获取 session token，前端会以 `Authorization: Bearer <token>` 发送。普通用户只能访问自己的订阅源、节点、配置档、令牌、访问日志和订阅输出，管理员可查看和维护全部资源。

```bash
wrangler secret put ADMIN_TOKEN
```

## 数据库

先在 Cloudflare 创建 D1 数据库与 KV namespace，然后把 `apps/web/wrangler.jsonc` 里的占位 ID 替换成真实值。
迁移文件位于 `apps/web/migrations`，由 wrangler 从 `apps/web` 包执行。

```bash
pnpm db:migrate:local
pnpm db:migrate:remote
```

## 测试

```bash
pnpm test
pnpm test:e2e
pnpm typecheck
pnpm build
pnpm build:api
```

当前测试覆盖订阅 URI 解析、Clash/v2rayN/明文/sing-box 渲染、Worker 管理员令牌提取和授权判断、Cloudflare Workers 运行时健康检查、首个管理员初始化、用户登录、多用户资源隔离，以及浏览器端控制台导航和登录流程。

## 订阅格式

默认输出 Clash YAML：

```text
/sub/:token
/sub/:token?format=clash
```

同时支持：

```text
/sub/:token?format=v2rayn
/sub/:token?format=plain
/sub/:token?format=sing-box
```

- `v2rayn`：多行节点 URI 的 base64 订阅。
- `plain`：明文多行节点 URI。
- `sing-box`：sing-box JSON 配置。

## 节点协议

订阅源和手动节点都会解析 URI。当前支持 `ss`、`ssr`、`vmess`、`vless`、`trojan`、`hysteria`、`hysteria2`/`hy2`、`tuic`、`wireguard`/`wg`、`http`/`https`、`socks`/`socks4`/`socks5`、`ssh`、`snell`、`naive`、`shadowtls`/`shadow-tls`、`anytls`、`mieru`、`juicity`、`masque`、`sudoku`、`trust-tunnel`。

`plain` 和 `v2rayn` 会保留原始 URI，适合客户端自行识别完整协议能力；Clash 输出会尽量保留可映射字段。sing-box 输出只转换字段结构确定的协议，SSR、Snell、Mieru、Juicity、MASQUE、Sudoku、TrustTunnel 等没有稳定等价映射的类型不会强行生成 outbound。

## 节点管理

订阅源支持按名称、链接、错误信息搜索，可编辑名称和链接，并可按启用状态和刷新结果筛选；支持批量刷新全部已启用订阅源；停用订阅源后，该源下节点不会进入生成订阅。

节点支持单条 URI 添加、启停、删除、名称编辑、搜索筛选和逗号分隔的分组编辑。订阅源刷新会保留同一原始 URI 节点的本地名称、分组和启停状态，避免上游更新覆盖人工整理结果。

节点列表支持勾选批量操作，可批量启停、删除、覆盖分组或追加分组，并可导出当前筛选结果为 CSV。

节点新增、编辑、删除以及订阅源刷新、删除后，会清理已生成的订阅 KV 缓存，确保客户端下次请求拿到最新内容。

令牌可以绑定配置档；绑定后订阅输出使用配置档名称和默认策略组，配置档停用时该令牌订阅不可用。未绑定配置档的令牌使用令牌名称和默认 `Proxy` 策略。

令牌列表可以按名称、令牌、配置档搜索，并按 Clash、v2rayN Base64、明文 URI、sing-box JSON 复制或打开订阅地址，同时支持编辑令牌名称、过期时间、配置档绑定和导出当前筛选结果；CSV 中的令牌值会保持脱敏。

订阅源、配置档和访问日志也支持本地搜索筛选并导出当前筛选结果为 CSV；访问日志可复制或打开历史订阅路径，便于在规则和订阅访问记录增多后快速定位目标。

概览页会从刷新任务、订阅访问、订阅源和令牌记录中聚合最近事件，并提供一键批量刷新已启用订阅源的快捷入口。

配置档规则支持新增、编辑、上移、下移、启停和删除，并按排序升序写入 Clash 订阅；如果没有 `MATCH` 规则，会自动追加 `MATCH,<默认策略>` 兜底。v2rayN、明文和 sing-box 当前不转换配置档规则。

## 当前完成度

- Cloudflare Workers 前后端同部署入口已完成，`/api/*`、`/sub/*` 走 Worker，静态页面走 Workers Static Assets。
- 订阅源、单节点、节点分组、批量节点操作、配置档、配置档规则、令牌、访问日志和概览页已完成基础闭环。
- Clash、v2rayN Base64、明文 URI、sing-box 四类订阅输出已完成；明文和 v2rayN 会保留原始 URI。
- 前端已迁移到 Tailwind CSS v4 + shadcn/ui 组件体系，支持白天/夜晚主题，旧全局样式已收敛到 `apps/web/src/styles.css`。
- 管理 API 已支持首个管理员初始化、邮箱密码登录、session token、多用户管理和普通用户资源隔离。
- `ADMIN_TOKEN` 已保留为初始化保护和管理员兜底入口，公开订阅仍使用订阅令牌保护。
- 删除配置档时会显式解绑令牌并清理规则，避免外键行为不一致导致订阅令牌引用失效配置档。
- 已接入 Vitest、Cloudflare Workers Vitest pool 和 Playwright E2E，覆盖核心逻辑、Worker 运行时和浏览器流程。

## 后续计划

- 生产部署前必须替换 `apps/web/wrangler.jsonc` 中的 D1 database id 和 KV namespace id。
- 完善用户自助能力，例如修改密码、会话续期、主动踢下线和登录失败限流。
- 继续补齐特殊协议到 Clash/sing-box 的高保真映射；无法稳定映射的协议会继续通过明文和 v2rayN 输出保留原始 URI。
- 补充生产运维能力，例如访问限流、审计日志、D1/KV 备份恢复流程和部署验收清单。

## 开发约定

- 文件按模块拆分，TS/TSX/CSS 文件接近 160 行时优先拆分。
- 复杂流程必须写简短注释，说明为什么这样做，不写重复代码含义的注释。
- 前端功能按 `features/*` 拆分，通用 UI 放到 `shared/*`。
- 新 UI 优先使用 `src/components/ui/*` 下的 shadcn/ui 组件，筛选、按钮和基础输入控件按模块渐进迁移。
- Worker 后端按 `modules/*` 拆分，路由、repository、service 分开维护。
- 订阅格式相关逻辑放在 `packages/subscription/src/renderers/*`，不要继续堆到单一文件。

## 部署

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrate:remote
pnpm deploy
```

部署前检查：

- 在 Cloudflare 创建 D1 数据库和 KV namespace。
- 将 [apps/web/wrangler.jsonc](apps/web/wrangler.jsonc) 中的 `database_id` 和 `kv_namespaces.id` 替换为真实资源 ID。
- 按需设置 `ADMIN_TOKEN`：`wrangler secret put ADMIN_TOKEN`。
- 执行 `pnpm db:migrate:remote` 后再部署，确保远程 D1 schema 与代码一致。
- 首次打开站点后创建管理员账号；如果设置了 `ADMIN_TOKEN`，初始化表单需要填写同一个令牌。

# smagicalsub

运行在 Cloudflare Workers 上的订阅管理 Web 项目，前端使用 React/Vite，后端使用 Hono Worker API，数据层使用 D1 + KV。

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/smagical/smagicalsub)

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

`packages/subscription` 原先命名为 `packages/clash`，但实际职责已经覆盖 Clash YAML、v2rayN Base64、明文 URI、sing-box JSON 和 Xray JSON，因此改为更贴近职责的订阅处理包。

前后端通过仓库根目录的 `wrangler.jsonc` 同时部署到 Cloudflare Workers：静态资源由 Workers Static Assets 托管，`/api/*` 和 `/sub/*` 会先进入 `apps/worker/src/index.ts` 的 Hono 路由。

## 本地开发

```bash
pnpm install
pnpm dev
```

## 认证与权限

管理 API 支持邮箱密码登录和 session token。首次启动时会进入管理员初始化流程；如果配置了 `ADMIN_TOKEN`，初始化首个管理员时必须提交同一个令牌，避免公开部署后被他人抢先初始化。

`ADMIN_TOKEN` 仍保留为管理员兜底入口和初始化保护令牌；普通用户通过登录接口获取 session token，前端会以 `Authorization: Bearer <token>` 发送。普通用户只能访问自己的订阅源、节点、配置档、令牌、访问日志和订阅输出，管理员可查看和维护全部资源。

账号安全已支持自助修改密码、登录失败限流、活跃会话自动续期，以及在设置页查看并撤销其他登录会话。会话管理只记录会话创建和过期时间，不追踪设备信息、IP 或 User-Agent。

部署初始化页位于 `/setup`。默认 `SETUP_MODE=auto` 时，仅在首个管理员尚未创建时显示；创建管理员成功后服务端返回 `302 /`，浏览器回到主页面。需要重新打开初始化页时，可在 Cloudflare 变量中临时设置 `SETUP_MODE=enabled`；需要完全关闭时设置 `SETUP_MODE=disabled`。

`ADMIN_TOKEN` 是可选的恢复和初始化保护令牌。推荐在 Cloudflare Dashboard 的 `Workers & Pages -> 你的 Worker -> Settings -> Variables and Secrets` 中添加 Secret；不配置也可以完成首次初始化，但不会启用忘记密码时的兜底恢复入口。

## 数据库

根目录 `wrangler.jsonc` 使用 Wrangler automatic provisioning 声明 `DB` 和 `KV` binding。首次 `wrangler deploy` 时，Cloudflare 会为缺少资源 ID 的 D1 数据库与 KV namespace 自动创建资源；从 Deploy Button / Dashboard / GitHub 集成部署时，自动创建出的资源 ID 会显示在 Cloudflare 控制台中。

迁移文件位于 `apps/web/migrations`，根目录 `wrangler.jsonc` 通过 `migrations_dir` 指向该目录；根目录脚本会按 D1 binding 名 `DB` 执行迁移。

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

当前测试覆盖订阅 URI 解析、Clash/v2rayN/明文/sing-box/Xray 渲染、Worker 管理员令牌提取和授权判断、Cloudflare Workers 运行时健康检查、首个管理员初始化、用户登录、多用户资源隔离，以及浏览器端控制台导航和登录流程。
认证相关测试还覆盖修改密码、失败登录限流、活跃会话续期、会话列表和撤销其他会话。

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
/sub/:token?format=xray
```

- `v2rayn`：多行节点 URI 的 base64 订阅。
- `plain`：明文多行节点 URI。
- `sing-box`：sing-box JSON 配置。
- `xray`：Xray-core JSON 配置。

## 节点协议

订阅源和手动节点都会解析 URI。当前支持 `ss`、`ssr`、`vmess`、`vless`、`trojan`、`hysteria`、`hysteria2`/`hy2`、`tuic`、`wireguard`/`wg`、`http`/`https`、`socks`/`socks4`/`socks5`、`ssh`、`snell`、`naive`、`shadowtls`/`shadow-tls`、`anytls`、`mieru`、`juicity`、`masque`、`sudoku`、`trust-tunnel`。

`plain` 和 `v2rayn` 会保留原始 URI，适合客户端自行识别完整协议能力；Clash 输出会尽量保留可映射字段。sing-box 和 Xray 输出只转换字段结构确定的协议，SSR、Snell、Mieru、Juicity、MASQUE、Sudoku、TrustTunnel 等没有稳定等价映射的类型不会强行生成 outbound。

## 节点管理

订阅源支持按名称、链接、错误信息搜索，可编辑名称和链接，并可按启用状态和刷新结果筛选；支持批量刷新全部已启用订阅源；停用订阅源后，该源下节点不会进入生成订阅。

节点支持单条 URI 添加、启停、删除、名称编辑、搜索筛选和逗号分隔的分组编辑。订阅源刷新会保留同一原始 URI 节点的本地名称、分组和启停状态，避免上游更新覆盖人工整理结果。

节点列表支持勾选批量操作，可批量启停、删除、覆盖分组或追加分组，并可导出当前筛选结果为 CSV。

节点新增、编辑、删除以及订阅源刷新、删除后，会清理已生成的订阅 KV 缓存，确保客户端下次请求拿到最新内容。

令牌可以绑定配置档；绑定后订阅输出使用配置档名称和默认策略组，配置档停用时该令牌订阅不可用。未绑定配置档的令牌使用令牌名称和默认 `Proxy` 策略。

令牌列表可以按名称、令牌、配置档搜索，并按 Clash、v2rayN Base64、明文 URI、sing-box JSON、Xray JSON 复制或打开订阅地址，同时支持编辑令牌名称、过期时间、配置档绑定和导出当前筛选结果；CSV 中的令牌值会保持脱敏。

订阅源、配置档和访问日志也支持本地搜索筛选并导出当前筛选结果为 CSV；访问日志可复制或打开历史订阅路径，便于在规则和订阅访问记录增多后快速定位目标。

概览页会从刷新任务、订阅访问、订阅源和令牌记录中聚合最近事件，并提供一键批量刷新已启用订阅源的快捷入口。

配置档规则支持新增、编辑、上移、下移、启停和删除，并按排序升序写入 Clash、sing-box 和 Xray 订阅；如果没有 `MATCH` 规则，会自动追加 `MATCH,<默认策略>` 兜底。规则弹窗内提供默认分流、国内直连和全局代理预设模板。v2rayN 和明文仍保留原始节点 URI，不转换配置档规则。

## 当前完成度

- Cloudflare Workers 前后端同部署入口已完成，`/api/*`、`/sub/*` 走 Worker，静态页面走 Workers Static Assets。
- 订阅源、单节点、节点分组、批量节点操作、配置档、配置档规则、令牌、访问日志和概览页已完成基础闭环。
- Clash、v2rayN Base64、明文 URI、sing-box 和 Xray 五类订阅输出已完成；明文和 v2rayN 会保留原始 URI。
- 前端已迁移到 Tailwind CSS v4 + shadcn/ui 组件体系，支持白天/夜晚主题，旧全局样式已收敛到 `apps/web/src/styles.css`。
- 管理 API 已支持首个管理员初始化、邮箱密码登录、session token、多用户管理、普通用户资源隔离、修改密码、登录失败限流、活跃会话续期和撤销其他登录会话。
- 设置页已支持动态站点名称、副标题、标题图片、登录文案、账号安全和会话管理。
- `ADMIN_TOKEN` 已保留为初始化保护和管理员兜底入口，公开订阅仍使用订阅令牌保护。
- 删除配置档时会显式解绑令牌并清理规则，避免外键行为不一致导致订阅令牌引用失效配置档。
- 已接入 Vitest、Cloudflare Workers Vitest pool 和 Playwright E2E，覆盖核心逻辑、Worker 运行时和浏览器流程。

## 后续计划

- 生产部署可通过 Workers Git 集成自动构建、自动创建 D1/KV、自动迁移和自动部署。
- 首次远程部署后需要确认自动创建的 D1/KV 资源，并完成一次真实 Cloudflare Workers 部署验收。
- 继续补齐特殊协议到 Clash/sing-box/Xray 的高保真映射；无法稳定映射的协议会继续通过明文和 v2rayN 输出保留原始 URI。
- 继续打磨控制台视觉和移动端细节，重点是仪表盘、节点表格、配置档规则和登录页。
- 补充生产运维能力，例如订阅访问限流、审计日志、D1/KV 备份恢复流程和部署验收清单。

## 开发约定

- 文件按模块拆分，TS/TSX/CSS 文件接近 160 行时优先拆分。
- 复杂流程必须写简短注释，说明为什么这样做，不写重复代码含义的注释。
- 前端功能按 `features/*` 拆分，通用 UI 放到 `shared/*`。
- 新 UI 优先使用 `src/components/ui/*` 下的 shadcn/ui 组件，筛选、按钮和基础输入控件按模块渐进迁移。
- Worker 后端按 `modules/*` 拆分，路由、repository、service 分开维护。
- 订阅格式相关逻辑放在 `packages/subscription/src/renderers/*`，不要继续堆到单一文件。

## 部署

### 一键部署

点击 README 顶部的 **Deploy to Cloudflare** 按钮即可从 GitHub 仓库创建 Worker 项目。Cloudflare 会在仓库根目录读取 `wrangler.jsonc`，在首次部署时自动创建 D1 数据库和 KV namespace，并运行 `pnpm run deploy` 完成构建、部署和 D1 远程迁移。

首次部署时可在 Cloudflare 页面填写或后续补充运行时 Secret。`ADMIN_TOKEN` 是可选恢复令牌和初始化保护令牌，不配置也可以完成首个管理员初始化；如果配置了，创建首个管理员时需要填写同一个令牌，用来防止公开站点被他人抢先初始化。不配置时仅关闭“忘记管理员密码”的兜底恢复入口。建议在 Cloudflare Dashboard 的 Variables and Secrets 页面添加 Secret：

```text
Name: ADMIN_TOKEN
Type: Secret
Value: 你的恢复令牌
```

部署完成后打开站点，进入 `/setup` 创建首个管理员；创建成功后会 `302` 回到主页。

### GitHub 自动部署

Cloudflare Workers Git 集成可直接连接本仓库，推送 `dev` 分支后自动构建、自动 provision D1/KV、自动迁移并部署。建议在 Cloudflare Dashboard 中配置：

```text
Repository: smagical/smagicalsub
Production branch: dev
Root directory: /
Build command: pnpm typecheck && pnpm test:unit && pnpm test:worker
Deploy command: pnpm run deploy
```

`pnpm run deploy` 会在仓库根目录构建 Vite/Worker、按根目录 `wrangler.jsonc` 执行 `wrangler deploy`，然后通过 `scripts/apply-remote-d1-migrations.mjs` 自动查找 Cloudflare 创建出的 D1 `database_id` 并执行远程迁移。这里必须使用 `pnpm run deploy`，不要写成 `pnpm deploy`，后者会触发 pnpm 自带的 workspace deploy 命令。

建议在 Build variables 中固定运行时版本：

```text
NODE_VERSION=22
PNPM_VERSION=10
```

运行时变量：

```text
APP_ENV=production
APP_LOG_LEVEL=0
SETUP_MODE=auto
SUBSCRIPTION_CACHE_TTL_SECONDS=300
```

`APP_LOG_LEVEL` 控制 Worker 应用日志输出，默认 `0` 不输出本项目的结构化诊断日志。排查问题时可在 Cloudflare Dashboard 的 Variables and Secrets 中临时改为 `3`，测试完成后再改回 `0`：

- `0`：默认，不输出应用结构化日志。
- `1`：只输出错误日志。
- `2`：输出警告和错误日志。
- `3`：输出完整初始化诊断日志。

旧版文字值 `silent` / `error` / `warn` / `info` 仍兼容，但建议使用数字，避免后台配置时填错。

`ADMIN_TOKEN` 可作为 Secret 配置一次，用于管理员密码恢复和初始化保护；不配置也不影响首次创建管理员，配置后首次初始化表单需要输入同一个值：

```text
Worker Settings -> Variables and Secrets -> Add Secret -> ADMIN_TOKEN
```

`SETUP_MODE` 可选值：

- `auto`：默认，仅首装缺管理员时开放 `/setup`。
- `enabled`：强制开放 `/setup`，用于需要重新查看部署检测或重新初始化入口的场景。
- `disabled`：强制关闭 `/setup`。

### 手动部署

```bash
pnpm typecheck
pnpm test
pnpm run deploy
```

部署前检查：

- [wrangler.jsonc](wrangler.jsonc) 的 `DB` / `KV` 使用 automatic provisioning；如果你手动填写了 Cloudflare 控制台中的资源 ID，也可以继续固定绑定到已有资源。
- 按需设置 `ADMIN_TOKEN`：在 Cloudflare Dashboard 的 Variables and Secrets 页面添加 Secret。
- `pnpm run deploy` 会自动解析远程 D1 `database_id` 并执行远程迁移，确保远程 schema 与代码一致。
- 首次打开站点后创建管理员账号；如果设置了 `ADMIN_TOKEN`，初始化表单需要填写同一个令牌。

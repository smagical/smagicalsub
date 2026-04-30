# smagicalsub

运行在 Cloudflare Workers 上的订阅管理 Web 项目，前端使用 React/Vite，后端使用 Hono Worker API，数据层使用 D1 + KV。

## 技术栈

- TypeScript 全栈
- pnpm workspace
- React + Vite
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

## 数据库

先在 Cloudflare 创建 D1 数据库与 KV namespace，然后把 `apps/web/wrangler.jsonc` 里的占位 ID 替换成真实值。

```bash
pnpm db:migrate:local
pnpm db:migrate:remote
```

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

## 开发约定

- 文件按模块拆分，TS/TSX/CSS 文件接近 160 行时优先拆分。
- 复杂流程必须写简短注释，说明为什么这样做，不写重复代码含义的注释。
- 前端功能按 `features/*` 拆分，通用 UI 放到 `shared/*`。
- Worker 后端按 `modules/*` 拆分，路由、repository、service 分开维护。
- 订阅格式相关逻辑放在 `packages/subscription/src/renderers/*`，不要继续堆到单一文件。

## 部署

```bash
pnpm deploy
```

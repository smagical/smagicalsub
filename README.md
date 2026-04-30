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

令牌可以绑定配置档；绑定后订阅输出使用配置档名称和默认策略组，配置档停用时该令牌订阅不可用。未绑定配置档的令牌使用令牌名称和默认 `Proxy` 策略。

## 开发约定

- 文件按模块拆分，TS/TSX/CSS 文件接近 160 行时优先拆分。
- 复杂流程必须写简短注释，说明为什么这样做，不写重复代码含义的注释。
- 前端功能按 `features/*` 拆分，通用 UI 放到 `shared/*`。
- Worker 后端按 `modules/*` 拆分，路由、repository、service 分开维护。
- 订阅格式相关逻辑放在 `packages/clash/src/renderers/*`，不要继续堆到单一文件。

## 部署

```bash
pnpm deploy
```

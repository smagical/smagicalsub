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

## 部署

```bash
pnpm deploy
```

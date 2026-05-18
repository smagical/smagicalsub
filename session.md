# Session

- 项目：`smagicalsub`
- 分支：`dev`
- 当前基线提交：`6e1178b`
- 当前状态：代码已提交，工作区干净。

## 技术栈

- TypeScript
- React + Vite
- shadcn/ui
- Tailwind v4
- Cloudflare Workers
- Hono
- D1 + KV
- pnpm workspace
- Vitest + Playwright

## 最近完成

- 节点列表和订阅列表已加前端分页。
- 规则列表的操作按钮已改成一行紧凑布局。
- 规则编排里“策略 / 自定义”布局已压缩为两行。
- 订阅输出已扩展到 Clash / v2rayN / 明文 / sing-box / Xray。

## 已验证

- `pnpm typecheck`
- `pnpm test:e2e`

## 预览

- 本地预览地址：`http://127.0.0.1:4173/`
- 仅在当前机器和当前进程存在时有效。

## 换电脑后恢复步骤

1. 克隆仓库并切到 `dev` 分支。
2. 执行 `pnpm install`。
3. 用 `git log --oneline -1` 确认当前基线是 `6e1178b`。
4. 执行 `pnpm typecheck`。
5. 执行 `pnpm test:e2e`。
6. 如果要看页面，进入 `apps/web` 后运行：

```bash
pnpm exec vite preview --outDir dist/client --host 127.0.0.1 --port 4173 --strictPort
```

## 下一步建议

- 继续优化节点和订阅列表的分页体验。
- 继续压缩配置档、规则编排、令牌页的空白。
- 逐步补齐单元测试和 e2e 覆盖。

# Session

- 项目：`smagicalsub`
- 仓库：`https://github.com/smagical/smagicalsub.git`
- 分支：`dev`
- 当前基线提交：`0f128a6`
- 当前状态：业务代码已提交；本交接文件 `session.md` 为新对话恢复信息，可能显示为未提交修改。
- 当前预览：已关闭，`4173 / 5173 / 8787 / 3000` 无本项目预览监听。

## 技术栈

- TypeScript
- React + Vite
- Tailwind v4 + shadcn/ui
- Cloudflare Workers + Hono
- D1 + KV
- pnpm workspace
- Vitest + Playwright

## 当前目标

构建运行在 Cloudflare Workers 上的订阅管理 Web 项目，前端现代化控制台，后端 Worker API，数据库使用 D1 + KV，支持多用户、订阅源、节点库、配置档、模块化配置、订阅令牌和多格式订阅输出。

## 已完成重点

- 支持 Clash YAML、Base64/v2rayN、明文、sing-box JSON、Xray JSON 输出。
- 支持订阅源、节点、配置档、令牌列表分页与每页数量选择。
- 支持单节点添加、节点分组、订阅源分组、令牌分组筛选。
- 支持配置模块：DNS、入站、TUN、策略组、规则集、代理集、观测、高级覆盖。
- 支持配置导入、远程导入、规则解析、参数表格编辑同步 JSON。
- UI 已迁移到 Tailwind v4 + shadcn/ui，并做过多轮布局压缩和弹窗样式优化。
- 已修复多格式配置导出核心问题：
  - sing-box WireGuard 使用 `endpoints`，不再生成废弃 `wireguard outbound`。
  - sing-box DNS FakeIP 使用 DNS server，移除旧 `dns.fakeip` / `independent_cache`。
  - sing-box 入站旧 `sniff/domain_strategy/udp_disable_domain_unmapping` 迁移为 route action。
  - sing-box `GEOSITE/GEOIP/RULE-SET geosite-* 或 geoip-*` 自动补 `route.rule_set`。
  - sing-box `endpoints` 按 `tag/name` 合并，避免高级覆盖覆盖节点生成的 endpoint。
  - Xray TUN 使用官方 `gateway[]/dns[]/autoSystemRoutingTable[]/autoOutboundsInterface` 字段。
  - Xray WireGuard 缺必填字段时跳过，避免生成无效 outbound。

## 最近提交

```text
0f128a6 fix: 完善多格式订阅配置导出 / improve multi-format subscription exports
```

提交说明已按要求中英双语：

- 中文：对照 sing-box、Xray 和 Clash/Mihomo 配置结构，修复 sing-box WireGuard endpoint、DNS FakeIP、入站嗅探迁移、Geo 规则集迁移、Xray TUN 和 WireGuard 字段校验，并补充导入解析与渲染测试。
- English: Align sing-box, Xray, and Clash/Mihomo export structure, fixing sing-box WireGuard endpoints, DNS FakeIP, inbound sniff migration, Geo rule-set migration, Xray TUN and WireGuard validation, with import and renderer test coverage.

## 已验证

- `pnpm test:unit`：21 个测试文件，83 个测试通过
- `pnpm test:worker`：11 个测试文件，35 个测试通过
- `pnpm typecheck`：通过
- `pnpm build`：通过
- `pnpm exec playwright test --reporter=line`：4 个 E2E 通过
- `git diff --check`：通过，仅 Windows LF/CRLF 提示
- BOM 检查：修改文件均无 BOM

## 新对话恢复步骤

1. 告诉新对话：工作目录是 `F:/code/node/smagicalsub`。
2. 让助手先读取本文件：`session.md`，并以本文件作为恢复上下文。
3. 确认基线：

```bash
git status --short
git log --oneline -1
```

期望 `git log --oneline -1` 显示 `0f128a6`。

4. 如需本地看页面，先构建再预览：

```bash
pnpm build
pnpm preview -- --host 127.0.0.1 --port 4173 --strictPort
```

如果用后台预览，要记录 PID 到 `.preview.pid`，下次对话先关闭。

## 新对话可直接发送

```text
工作目录：F:/code/node/smagicalsub
请先读取 session.md，然后按其中的项目状态继续。
当前项目是 smagicalsub，仓库 https://github.com/smagical/smagicalsub.git，dev 分支。
最新业务代码提交是 0f128a6。
不要重新初始化项目，不要推送远程；如需提交，提交信息继续使用中英双语，第一行写总结。
```

## 下一步建议

- 你先用真实客户端测试导出的 Clash / sing-box / Xray 配置。
- 如果真实客户端报错，保留完整错误和对应导出片段，继续按错误精确修。
- 后续可继续打磨 UI、补充更多真实配置样本、加真实二进制校验脚本。

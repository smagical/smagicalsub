# Session

- 项目：`smagicalsub`
- 仓库：`https://github.com/smagical/smagicalsub.git`
- 分支：`dev`
- 当前 HEAD：`0ffa6ae feat: add real subscription metrics`
- 当前业务基线提交：`0ffa6ae`
- 当前状态：业务代码和本交接文件均已提交并推送到 `origin/dev`。
- 当前预览：本地预览已开启，`http://127.0.0.1:4173/`，监听 PID `14416`；`/api/health` 返回 `migrationsReady:true`。
- 隐私说明：本文件不保存真实密码、令牌、Cookie、私钥、API Key 或 Cloudflare 账号凭据。

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
- 支持单条/批量节点合并导入：输入一条节点时可填写显示名称，输入多条节点时自动按批量导入处理并忽略手写名称。
- 支持节点全局去重：手动导入和订阅源导入共享节点本体，订阅关系记录到 `node_sources`。
- 支持删除订阅源时按来源关系清理节点：只有无手动来源且不再属于任何订阅源的节点才会删除。
- 支持删除手动节点时按来源关系判断：仍被订阅源引用的节点只移除手动来源，不删除节点本体。
- 支持配置模块：DNS、入站、TUN、策略组、规则集、代理集、观测、高级覆盖。
- 支持配置导入、远程导入、规则解析、参数表格编辑同步 JSON。
- UI 已迁移到 Tailwind v4 + shadcn/ui，并做过多轮布局压缩和弹窗样式优化。
- 初始化流程已支持 Cloudflare Worker 部署后的引导页检测：D1、KV、迁移、首个管理员等状态可在 `/setup` 页面逐步确认。
- Worker 日志支持数字级别开关，默认不输出详细日志，便于免费版生产环境关闭排查日志。
- Worker 结构化诊断日志改为设置页控制：`设置 -> 站点品牌 -> 应用日志级别`，`0` 关闭、`1` 仅错误、`2` 错误和警告、`3` 详细调试；日志只输出到 Cloudflare Workers Logs，不写入 D1。
- 概览页请求统计已改为真实 D1 小时聚合，新增 `subscription_metrics` 表；`access_logs` 仍是采样详细日志，同一令牌 5 分钟内最多写 1 条。
- Dashboard 进入时强制刷新，并每 15 秒刷新一次统计；迁移未完成时会显示“D1 迁移未完成”，不再显示假 0。
- D1 迁移包括 `apps/web/migrations/0001_initial.sql` 和 `0002_subscription_metrics.sql`；全新部署用 0001 建完整表，旧部署用 0002 补统计表。
- Base64 订阅格式参数统一为 `format=base64`，旧 `format=v2rayn` 仍兼容。
- 令牌复制按钮改为弹窗选择输出格式；订阅输出中心限制 Base64 预览高度，避免长文本撑高页面。
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
0ffa6ae feat: add real subscription metrics
8d64959 docs: 更新会话恢复信息
4d05aaf feat: add global node deduplication
bc07316 refactor: 合并节点单条和批量导入入口
81418b6 feat: 支持批量导入节点
eb9cb91 docs: 更新项目进度说明
ed38fcb chore: 使用数字配置日志级别
0f128a6 fix: 完善多格式订阅配置导出 / improve multi-format subscription exports
```

最近业务提交重点：

- `0ffa6ae`：新增真实订阅请求统计，写入 `subscription_metrics` 小时聚合表；Dashboard 改用真实统计并自动刷新；访问日志和 `last_used_at` 5 分钟节流；日志级别仅通过设置页控制；Base64 输出参数改为 `format=base64` 并兼容旧 `format=v2rayn`；补充迁移、Worker 测试和 E2E。
- `4d05aaf`：实现节点全局去重、手动来源和订阅来源关系追踪、删除保护规则，并补充 Worker 测试。
- `bc07316` / `81418b6`：合并单条和批量节点导入入口，导入时自动识别多行节点，展示新增/去重/失败结果。
- `ed38fcb`：日志级别改为数字配置，默认关闭详细日志。
- `0f128a6`：对照 sing-box、Xray 和 Clash/Mihomo 配置结构，修复多格式订阅导出，并补充导入解析与渲染测试。

## 已验证

- `pnpm test:unit`：21 个测试文件，83 个测试通过
- `pnpm test:worker`：12 个测试文件，47 个测试通过
- `pnpm typecheck`：通过
- `pnpm build`：通过
- `wrangler deploy --dry-run`：通过
- `pnpm exec playwright test --reporter=line`：6 个 E2E 通过
- `git diff --check`：通过，仅 Windows LF/CRLF 提示
- BOM 检查：修改文件均无 BOM
- 本地预览健康检查：`/api/health` 返回 `migrationsReady:true`

## 新对话恢复步骤

1. 告诉新对话：工作目录是 `F:/code/node/smagicalsub`。
2. 让助手先读取本文件：`session.md`，并以本文件作为恢复上下文。
3. 确认基线：

```bash
git status --short
git log --oneline -1
```

期望 `git log --oneline -1` 显示 `0ffa6ae feat: add real subscription metrics` 或后续 session 文档提交；业务代码基线是 `0ffa6ae`。

如果 `git status --short` 显示 `M session.md`，说明只是本交接文件在本地更新，业务代码仍已推送到 `origin/dev`。

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
最新业务代码提交是 0ffa6ae。
不要重新初始化项目，不要推送远程；如需提交，提交信息继续使用中英双语，第一行写总结。
```

## 下一步建议

- 继续用 Cloudflare 自动部署环境测试初始化、首个管理员创建、订阅源刷新和节点删除规则。
- 用真实客户端测试导出的 Clash / sing-box / Xray 配置；如客户端报错，保留完整错误和对应导出片段再精确修。
- 后续可继续打磨 UI、补充更多真实配置样本、加真实二进制校验脚本。

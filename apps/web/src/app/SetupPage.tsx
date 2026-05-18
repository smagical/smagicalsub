import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SetupStatusDto, SiteSettingsDto } from "@smagicalsub/shared";
import { CheckCircle2, Cloud, Copy, Database, KeyRound, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { BrandHeader } from "../shared/BrandHeader";
import { FilterField } from "../shared/FilterField";

type SetupPageProps = {
  settings: SiteSettingsDto;
  status?: SetupStatusDto;
  loading?: boolean;
  error?: string | null;
  onRefresh: () => void;
};

const buildCommand = "pnpm typecheck && pnpm test:unit && pnpm test:worker && pnpm build";
const deployCommand = "pnpm deploy:cloudflare";

export function SetupPage({ error, loading = false, onRefresh, settings, status }: SetupPageProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const readyForBootstrap = Boolean(status?.available && status.bootstrapRequired && status.resources.d1 && status.resources.kv && status.resources.migrations);

  async function copyText(label: string, value: string) {
    await navigator.clipboard?.writeText(value);
    setCopied(label);
  }

  return (
    <main className="app-shell min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl gap-5">
        <Card className="border bg-card/95">
          <div className="accent-strip h-1" />
          <CardHeader className="gap-4">
            <BrandHeader settings={settings} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">部署初始化</CardTitle>
                <CardDescription className="mt-1">按固定配置连接 GitHub 自动部署，首次部署会自动创建 D1 和 KV。</CardDescription>
              </div>
              <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
                {loading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Cloud data-icon="inline-start" />}
                检测状态
              </Button>
            </div>
          </CardHeader>
        </Card>

        {error ? <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="size-5 text-primary" />
                资源检测
              </CardTitle>
              <CardDescription>初始化完成后，默认不会再进入此页面；如需再次打开，可在 Cloudflare 设置 `SETUP_MODE=enabled`。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {status?.steps.map((step) => (
                <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/25 p-3" key={step.key}>
                  <div>
                    <div className="flex items-center gap-2">
                      {step.ok ? <CheckCircle2 className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-destructive" />}
                      <span className="font-medium">{step.label}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                  </div>
                  <Badge variant={step.ok ? "secondary" : "destructive"}>{step.ok ? "完成" : "待处理"}</Badge>
                </div>
              )) ?? <p className="text-sm text-muted-foreground">正在读取部署状态。</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <KeyRound className="size-5 text-primary" />
                创建管理员
              </CardTitle>
              <CardDescription>{readyForBootstrap ? "基础资源已就绪，创建首个管理员后浏览器会自动跳回主页。" : "请先完成 D1、KV、迁移和恢复令牌配置。"}</CardDescription>
            </CardHeader>
            <CardContent>
              {readyForBootstrap ? (
                <form action="/api/setup/bootstrap" className="grid gap-3" method="post">
                  <FilterField label="名称">
                    <Input name="name" required />
                  </FilterField>
                  <FilterField label="邮箱">
                    <Input name="email" required type="email" />
                  </FilterField>
                  <FilterField label="密码">
                    <Input minLength={8} name="password" required type="password" />
                  </FilterField>
                  {status?.bootstrapRequiresToken ? (
                    <FilterField label="初始化令牌">
                      <Input name="bootstrapToken" required />
                    </FilterField>
                  ) : null}
                  <Button size="lg" type="submit">
                    <ShieldCheck data-icon="inline-start" />
                    完成初始化
                  </Button>
                </form>
              ) : (
                <div className="rounded-lg border bg-muted/25 p-4 text-sm text-muted-foreground">检测全部通过后，这里会显示管理员创建表单。</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cloudflare GitHub 自动部署配置</CardTitle>
            <CardDescription>Workers Git 集成填这些命令；D1/KV 由 Wrangler automatic provisioning 自动创建。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <CommandBlock copied={copied === "build"} label="Build command" value={buildCommand} onCopy={() => copyText("build", buildCommand)} />
            <CommandBlock copied={copied === "deploy"} label="Deploy command" value={deployCommand} onCopy={() => copyText("deploy", deployCommand)} />
            <div className="rounded-lg border bg-muted/25 p-3 text-sm">
              <span className="font-medium">Root directory</span>
              <p className="mt-1 text-muted-foreground">仓库根目录：`/`</p>
            </div>
            <div className="rounded-lg border bg-muted/25 p-3 text-sm">
              <span className="font-medium">必要变量</span>
              <p className="mt-1 text-muted-foreground">Secret: `ADMIN_TOKEN`；可选变量：`SETUP_MODE=enabled|disabled|auto`。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function CommandBlock({ copied, label, onCopy, value }: { copied: boolean; label: string; onCopy: () => void; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Button onClick={onCopy} size="sm" type="button" variant="outline">
          <Copy data-icon="inline-start" />
          {copied ? "已复制" : "复制"}
        </Button>
      </div>
      <code className="block rounded-md bg-background p-3 text-xs leading-5 text-muted-foreground">{value}</code>
    </div>
  );
}

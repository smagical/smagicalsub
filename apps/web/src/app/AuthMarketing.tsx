import { Badge } from "@/components/ui/badge";
import type { SiteSettingsDto } from "@smagicalsub/shared";
import { Cloud, DatabaseZap, Layers3, RadioTower, Route, Sparkles, UsersRound, type LucideIcon } from "lucide-react";
import { BrandHeader } from "../shared/BrandHeader";

const capabilities = [
  { icon: Layers3, label: "多格式输出", text: "Clash、v2rayN、Sing-box、Base64 和明文订阅统一生成。" },
  { icon: Route, label: "节点分组", text: "订阅源解析节点与手动节点共用分组，方便按用途整理。" },
  { icon: Sparkles, label: "规则配置档", text: "不同令牌可绑定独立规则、策略和输出名称。" },
  { icon: UsersRound, label: "多用户隔离", text: "普通用户只管理自己的节点、配置档、令牌和访问日志。" }
];

const formats = ["Clash", "v2rayN", "Sing-box", "Base64", "Plain"];
const metrics = [
  { label: "Worker API", value: "/api/*" },
  { label: "订阅出口", value: "/sub/*" },
  { label: "缓存层", value: "KV" }
];

export function AuthMarketing({ settings }: { settings: SiteSettingsDto }) {
  return (
    <section className="flex min-h-[620px] flex-col justify-between gap-8 py-2 lg:py-8">
      <div className="flex flex-col gap-8">
        <BrandHeader settings={settings} />
        <div className="flex max-w-3xl flex-col gap-5">
          <Badge className="w-fit shadow-sm ring-1 ring-primary/15" variant="secondary">
            Cloudflare Workers 一体部署
          </Badge>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-normal text-foreground">
            {settings.siteName} 把订阅源、节点池和规则配置放进一个控制台
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            面向个人和团队的订阅管理入口：D1 存储结构化数据，KV 缓存订阅结果，前端和 API 统一运行在 Workers。
          </p>
        </div>
        <DashboardPreview />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {capabilities.map((item) => (
          <FeatureItem item={item} key={item.label} />
        ))}
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card/90 shadow-2xl ring-1 ring-primary/15">
      <div className="accent-strip h-1" />
      <div className="p-4">
        <div className="flex items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="brand-mark grid size-10 place-items-center rounded-md text-primary-foreground">
              <RadioTower className="size-5" />
            </div>
            <div>
              <strong className="text-sm">订阅生成链路</strong>
              <span className="block text-xs text-muted-foreground">源同步、节点分组、规则渲染和缓存刷新</span>
            </div>
          </div>
          <Badge className="shadow-sm">在线</Badge>
        </div>
        <div className="grid gap-3 py-4 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div className="rounded-md border bg-background/70 p-3" key={metric.label}>
              <span className="text-xs text-muted-foreground">{metric.label}</span>
              <strong className="mt-2 block text-lg">{metric.value}</strong>
            </div>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr]">
          <PreviewBlock icon={Cloud} title="订阅源" value="Clash / URI / Base64" />
          <div className="hidden items-center text-muted-foreground md:flex">→</div>
          <PreviewBlock icon={DatabaseZap} title="D1 + KV" value="节点、令牌、缓存" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {formats.map((format) => (
            <Badge key={format} variant="outline">
              {format}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewBlock({ icon: Icon, title, value }: { icon: LucideIcon; title: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-muted/50 p-3">
      <div className="grid size-9 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <strong className="block text-sm">{title}</strong>
        <span className="text-xs text-muted-foreground">{value}</span>
      </div>
    </div>
  );
}

function FeatureItem({ item }: { item: { icon: LucideIcon; label: string; text: string } }) {
  const Icon = item.icon;

  return (
    <div className="rounded-lg border bg-card/75 p-4 shadow-md shadow-primary/5 ring-1 ring-primary/10">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid size-8 place-items-center rounded-md bg-accent/30 text-accent-foreground">
          <Icon className="size-4" />
        </div>
        <strong className="text-sm font-semibold">{item.label}</strong>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{item.text}</p>
    </div>
  );
}

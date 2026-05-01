import { Badge } from "@/components/ui/badge";
import type { SiteSettingsDto } from "@smagicalsub/shared";
import { BrandHeader } from "../shared/BrandHeader";

const capabilities = [
  { label: "多格式输出", text: "Clash、v2rayN、Sing-box、Base64 和明文订阅统一生成。" },
  { label: "节点分组", text: "订阅源解析节点与手动节点共用分组，方便按用途整理。" },
  { label: "规则配置档", text: "不同令牌可绑定独立规则、策略和输出名称。" },
  { label: "多用户隔离", text: "普通用户只管理自己的节点、配置档、令牌和访问日志。" }
];

const formats = ["Clash", "v2rayN", "Sing-box", "Base64", "Plain"];

export function AuthMarketing({ settings }: { settings: SiteSettingsDto }) {
  return (
    <section className="flex min-h-[520px] flex-col justify-between gap-8 py-4 lg:py-8">
      <div className="flex flex-col gap-7">
        <BrandHeader settings={settings} />
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge>Cloudflare Workers</Badge>
            <Badge variant="secondary">D1 + KV</Badge>
            <Badge variant="outline">TypeScript</Badge>
          </div>
          <div className="flex max-w-3xl flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-normal text-foreground">
              {settings.siteName} 让订阅、节点和规则集中管理
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              为个人和团队准备的轻量订阅控制台，前端和 API 一起运行在 Cloudflare Workers，订阅数据通过 D1 与 KV 持久化和缓存。
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {capabilities.map((item) => (
            <div className="rounded-md border bg-card/70 p-4 shadow-sm" key={item.label}>
              <strong className="text-sm font-semibold">{item.label}</strong>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-md border bg-background/70 p-4 shadow-sm">
        <span className="text-sm font-medium text-muted-foreground">订阅输出格式</span>
        <div className="flex flex-wrap gap-2">
          {formats.map((format) => (
            <Badge key={format} variant="outline">
              {format}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}

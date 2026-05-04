import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { BootstrapAdminInput, LoginInput, SiteSettingsDto } from "@smagicalsub/shared";
import { ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { BrandHeader } from "../shared/BrandHeader";
import { FilterField } from "../shared/FilterField";
import { AuthMarketing } from "./AuthMarketing";

type LoginPanelProps = {
  error?: string | null;
  pending?: boolean;
  settings: SiteSettingsDto;
  onLogin: (input: LoginInput) => void;
};

export function LoginPanel({ error, pending = false, settings, onLogin }: LoginPanelProps) {
  const [form, setForm] = useState({ email: "", password: "" });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin(form);
  }

  return (
    <AuthCard description={settings.loginDescription} settings={settings} title={settings.loginTitle}>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <FilterField label="邮箱">
          <Input autoFocus onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} />
        </FilterField>
        <FilterField label="密码">
          <Input onChange={(event) => setForm({ ...form, password: event.target.value })} required type="password" value={form.password} />
        </FilterField>
        <PanelError message={error} />
        <Button disabled={pending} size="lg" type="submit">
          进入控制台
          <ArrowRight data-icon="inline-end" />
        </Button>
      </form>
    </AuthCard>
  );
}

type BootstrapPanelProps = {
  error?: string | null;
  pending?: boolean;
  requiresToken: boolean;
  settings: SiteSettingsDto;
  onBootstrap: (input: BootstrapAdminInput) => void;
};

export function BootstrapPanel({ error, pending = false, requiresToken, settings, onBootstrap }: BootstrapPanelProps) {
  const [form, setForm] = useState({ bootstrapToken: "", email: "", name: "", password: "" });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onBootstrap({ ...form, bootstrapToken: form.bootstrapToken || undefined });
  }

  return (
    <AuthCard description="创建首个管理员账号后即可进入控制台。" settings={settings} title="初始化管理员">
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <FilterField label="名称">
          <Input autoFocus onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} />
        </FilterField>
        <FilterField label="邮箱">
          <Input onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} />
        </FilterField>
        <FilterField label="密码">
          <Input onChange={(event) => setForm({ ...form, password: event.target.value })} required type="password" value={form.password} />
        </FilterField>
        {requiresToken ? (
          <FilterField label="初始化令牌">
            <Input onChange={(event) => setForm({ ...form, bootstrapToken: event.target.value })} required value={form.bootstrapToken} />
          </FilterField>
        ) : null}
        <PanelError message={error} />
        <Button disabled={pending} size="lg" type="submit">
          创建管理员
          <ArrowRight data-icon="inline-end" />
        </Button>
      </form>
    </AuthCard>
  );
}

export function StatusPanel({ description, settings, title }: { description: string; settings: SiteSettingsDto; title: string }) {
  return (
    <AuthCard description={description} settings={settings} title={title}>
      {null}
    </AuthCard>
  );
}

function AuthCard({ children, description, settings, title }: { children: ReactNode; description: string; settings: SiteSettingsDto; title: string }) {
  return (
    <main className="app-shell min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="order-2 lg:order-1">
          <AuthMarketing settings={settings} />
        </div>
        <Card className="order-1 w-full border bg-card/95 lg:order-2">
          <div className="accent-strip h-1" />
          <CardHeader className="gap-3 px-6 pt-6">
            <BrandHeader className="mb-2 lg:hidden" settings={settings} />
            <div className="flex items-center gap-2 rounded-lg border bg-muted/60 p-3">
              <div className="grid size-9 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/20">
                <KeyRound className="size-4" />
              </div>
              <div>
                <span className="block text-xs text-muted-foreground">安全入口</span>
                <span className="text-sm font-medium">Session Token + Owner Scope</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription className="leading-6">{description}</CardDescription>
            </div>
          </CardHeader>
          {children ? <CardContent className="px-6 pb-2">{children}</CardContent> : null}
          <CardFooter className="flex-col items-start gap-2 px-6">
            <TrustLine text="管理员可统一维护用户和全局资源" />
            <TrustLine text="普通用户默认只访问自己的节点和订阅" />
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

function PanelError({ message }: { message?: string | null }) {
  return message ? <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p> : null;
}

function TrustLine({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground">
      <CheckCircle2 className="size-3.5" />
      {text}
    </span>
  );
}

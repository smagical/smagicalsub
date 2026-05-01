import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { BootstrapAdminInput, LoginInput, SiteSettingsDto } from "@smagicalsub/shared";
import { useState, type FormEvent, type ReactNode } from "react";
import { BrandHeader } from "../shared/BrandHeader";
import { FilterField } from "../shared/FilterField";

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
        <Button disabled={pending} type="submit">
          进入控制台
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
        <Button disabled={pending} type="submit">
          创建管理员
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
    <main className="app-shell grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-sm border-t-[3px] border-t-primary/70 bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader>
          <BrandHeader className="mb-2" settings={settings} />
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children ? <CardContent>{children}</CardContent> : null}
      </Card>
    </main>
  );
}

function PanelError({ message }: { message?: string | null }) {
  return message ? <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p> : null;
}

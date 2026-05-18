import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LoginInput, RecoverAdminPasswordInput, SiteSettingsDto } from "@smagicalsub/shared";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, RotateCcw } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { BrandHeader } from "../shared/BrandHeader";
import { FilterField } from "../shared/FilterField";
import { AuthMarketing } from "./AuthMarketing";

type LoginPanelProps = {
  error?: string | null;
  pending?: boolean;
  recoveryError?: string | null;
  recoveryPending?: boolean;
  recoverySuccess?: boolean;
  settings: SiteSettingsDto;
  onLogin: (input: LoginInput) => void;
  onRecoverPassword: (input: RecoverAdminPasswordInput) => void;
};

export function LoginPanel({
  error,
  pending = false,
  recoveryError,
  recoveryPending = false,
  recoverySuccess = false,
  settings,
  onLogin,
  onRecoverPassword
}: LoginPanelProps) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryForm, setRecoveryForm] = useState({ adminToken: "", email: "", password: "" });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin(form);
  }

  function handleRecoverySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRecoverPassword(recoveryForm);
  }

  return (
    <AuthCard description={settings.loginDescription} settings={settings} title={settings.loginTitle}>
      {recoveryOpen ? (
        <form className="flex flex-col gap-3" onSubmit={handleRecoverySubmit}>
          <FilterField label="管理员邮箱">
            <Input autoFocus onChange={(event) => setRecoveryForm({ ...recoveryForm, email: event.target.value })} required type="email" value={recoveryForm.email} />
          </FilterField>
          <FilterField label="恢复令牌">
            <Input onChange={(event) => setRecoveryForm({ ...recoveryForm, adminToken: event.target.value })} required value={recoveryForm.adminToken} />
          </FilterField>
          <FilterField label="新密码">
            <Input minLength={8} onChange={(event) => setRecoveryForm({ ...recoveryForm, password: event.target.value })} required type="password" value={recoveryForm.password} />
          </FilterField>
          <PanelError message={recoveryError} />
          {recoverySuccess ? <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">密码已重置，请使用新密码登录。</p> : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="sm:flex-1" disabled={recoveryPending} size="lg" type="submit">
              重置管理员密码
              <RotateCcw data-icon="inline-end" />
            </Button>
            <Button className="sm:w-auto" onClick={() => setRecoveryOpen(false)} size="lg" type="button" variant="outline">
              <ArrowLeft data-icon="inline-start" />
              返回登录
            </Button>
          </div>
        </form>
      ) : (
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
          <Button className="justify-start px-0 text-muted-foreground" onClick={() => setRecoveryOpen(true)} type="button" variant="link">
            忘记管理员密码？
          </Button>
        </form>
      )}
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

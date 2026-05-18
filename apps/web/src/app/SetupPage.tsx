import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { BootstrapAdminInput, SetupStatusDto, SiteSettingsDto } from "@smagicalsub/shared";
import { ArrowLeft, ArrowRight, CheckCircle2, Database, KeyRound, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { cn } from "../lib/utils";
import { BrandHeader } from "../shared/BrandHeader";
import { FilterField } from "../shared/FilterField";

type SetupPageProps = {
  settings: SiteSettingsDto;
  status?: SetupStatusDto;
  loading?: boolean;
  error?: string | null;
  bootstrapPending?: boolean;
  bootstrapError?: string | null;
  onBootstrap: (input: BootstrapAdminInput) => void;
  onRefresh: () => void;
};

type SetupStep = SetupStatusDto["steps"][number];

const SETUP_STEP_ORDER: SetupStep["key"][] = ["d1", "kv", "migrations", "adminToken", "adminUser"];

export function SetupPage({ bootstrapError, bootstrapPending = false, error, loading = false, onBootstrap, onRefresh, settings, status }: SetupPageProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const readyForBootstrap = Boolean(status?.available && status.bootstrapRequired && status.resources.d1 && status.resources.kv && status.resources.migrations);
  const [form, setForm] = useState({ bootstrapToken: "", email: "", name: "", password: "" });
  const steps = orderedSetupSteps(status);
  const currentStep = steps[currentStepIndex] ?? steps[0];
  const currentStepNumber = currentStep ? currentStepIndex + 1 : 0;
  const canGoNext = currentStep ? currentStep.ok || !currentStep.required : false;
  const isLastStep = currentStepIndex >= steps.length - 1;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onBootstrap({ ...form, bootstrapToken: form.bootstrapToken || undefined });
  }

  function goBack() {
    setCurrentStepIndex((index) => Math.max(0, index - 1));
  }

  function goNext() {
    setCurrentStepIndex((index) => Math.min(steps.length - 1, index + 1));
  }

  return (
    <main className="app-shell min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl content-start gap-5">
        <Card className="border bg-card/95">
          <div className="accent-strip h-1" />
          <CardHeader className="gap-4">
            <BrandHeader settings={settings} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">部署初始化</CardTitle>
                <CardDescription className="mt-1">按步骤检测资源并创建首个管理员，完成后会自动进入控制台。</CardDescription>
              </div>
              <Button disabled={loading} onClick={onRefresh} type="button" variant="outline">
                {loading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <RefreshCw data-icon="inline-start" />}
                重新检测
              </Button>
            </div>
          </CardHeader>
        </Card>

        {error ? <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

        <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="size-5 text-primary" />
                初始化步骤
              </CardTitle>
              <CardDescription>一步一步确认资源状态；可选步骤可以跳过。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {steps.length ? (
                steps.map((step, index) => (
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3",
                      index === currentStepIndex ? "border-primary/50 bg-muted/60" : "bg-muted/20"
                    )}
                    key={step.key}
                  >
                    <div className={cn("grid size-8 shrink-0 place-items-center rounded-md border text-sm font-medium", step.ok ? "bg-primary text-primary-foreground" : "bg-background")}>
                      {step.ok ? <CheckCircle2 className="size-4" /> : index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{step.label}</span>
                        <Badge variant={step.required ? "default" : "outline"}>{step.required ? "必需" : "可选"}</Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{step.ok ? "已通过" : step.required ? "待检测通过" : "可跳过"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">正在读取初始化状态。</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {currentStep?.key === "adminUser" ? <KeyRound className="size-5 text-primary" /> : <Database className="size-5 text-primary" />}
                {currentStep ? `步骤 ${currentStepNumber}：${currentStep.label}` : "读取状态"}
              </CardTitle>
              <CardDescription>
                {currentStep ? `第 ${currentStepNumber} / ${steps.length} 步。${currentStep.required ? "该步骤必须完成后才能继续。" : "该步骤可选，可以直接跳过。"}` : "正在连接 Worker。"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!status || !currentStep ? (
                <div className="rounded-lg border bg-muted/25 p-4 text-sm text-muted-foreground">正在读取部署状态。</div>
              ) : currentStep.key === "adminUser" ? (
                readyForBootstrap ? (
                  <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                    <FilterField label="名称">
                      <Input onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} />
                    </FilterField>
                    <FilterField label="邮箱">
                      <Input onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} />
                    </FilterField>
                    <FilterField label="密码">
                      <Input onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={8} required type="password" value={form.password} />
                    </FilterField>
                    {status.bootstrapRequiresToken ? (
                      <FilterField label="初始化令牌">
                        <Input onChange={(event) => setForm({ ...form, bootstrapToken: event.target.value })} required value={form.bootstrapToken} />
                      </FilterField>
                    ) : null}
                    <p className="text-sm text-muted-foreground">创建首个管理员后，系统会自动写入登录态并返回主页。</p>
                    {bootstrapError ? <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">{bootstrapError}</p> : null}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button onClick={goBack} size="lg" type="button" variant="outline">
                        <ArrowLeft data-icon="inline-start" />
                        上一步
                      </Button>
                      <Button className="sm:flex-1" disabled={bootstrapPending} size="lg" type="submit">
                        {bootstrapPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <ShieldCheck data-icon="inline-start" />}
                        {bootstrapPending ? "正在初始化" : "完成初始化"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <SetupStepActions
                    canGoBack={currentStepIndex > 0}
                    canGoNext={false}
                    detail="前置资源尚未全部通过，请返回未完成步骤重新检测。"
                    isLastStep={isLastStep}
                    loading={loading}
                    step={currentStep}
                    onBack={goBack}
                    onNext={goNext}
                    onRefresh={onRefresh}
                  />
                )
              ) : (
                <SetupStepActions
                  canGoBack={currentStepIndex > 0}
                  canGoNext={canGoNext}
                  isLastStep={isLastStep}
                  loading={loading}
                  step={currentStep}
                  onBack={goBack}
                  onNext={goNext}
                  onRefresh={onRefresh}
                />
              )}
            </CardContent>
          </Card>
        </div>

        <p className="text-sm text-muted-foreground">初始化完成后默认不会再进入此页面；如需再次打开，可在 Cloudflare 设置 `SETUP_MODE=enabled`。</p>
      </div>
    </main>
  );
}

function SetupStepActions({
  canGoBack,
  canGoNext,
  detail,
  isLastStep,
  loading,
  step,
  onBack,
  onNext,
  onRefresh
}: {
  canGoBack: boolean;
  canGoNext: boolean;
  detail?: string;
  isLastStep: boolean;
  loading: boolean;
  step: SetupStep;
  onBack: () => void;
  onNext: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-muted/25 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {step.ok ? <CheckCircle2 className="size-5 text-primary" /> : <XCircle className="size-5 text-destructive" />}
            <span className="font-medium">{step.ok ? "检测通过" : step.required ? "等待处理" : "未配置"}</span>
          </div>
          <Badge variant={step.ok ? "secondary" : step.required ? "destructive" : "outline"}>{step.ok ? "完成" : step.required ? "待完成" : "可选"}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{detail ?? step.detail}</p>
        {step.key === "adminToken" ? <AdminTokenGuide configured={step.ok} /> : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button disabled={!canGoBack} onClick={onBack} size="lg" type="button" variant="outline">
          <ArrowLeft data-icon="inline-start" />
          上一步
        </Button>
        <Button disabled={loading} onClick={onRefresh} size="lg" type="button" variant="outline">
          {loading ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <RefreshCw data-icon="inline-start" />}
          重新检测
        </Button>
        <Button className="sm:flex-1" disabled={!canGoNext || isLastStep} onClick={onNext} size="lg" type="button">
          {step.required || step.ok ? "下一步" : "跳过此项"}
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}

function AdminTokenGuide({ configured }: { configured: boolean }) {
  return (
    <div className="mt-3 flex flex-col gap-3 rounded-lg border bg-background p-3">
      <div>
        <p className="text-sm font-medium">{configured ? "恢复令牌已启用" : "在 Cloudflare 页面设置恢复令牌"}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {configured ? "后续忘记管理员密码时，可以在登录页使用这个 Secret 重置密码。" : "恢复令牌只用于忘记管理员密码时重置密码，不影响首次初始化；不想设置可以直接跳过。"}
        </p>
      </div>
      {configured ? null : (
        <ol className="grid gap-2 text-sm text-muted-foreground">
          <li>1. 打开 Cloudflare Dashboard，进入 Workers & Pages。</li>
          <li>2. 选择这个项目对应的 Worker。</li>
          <li>3. 进入 Settings，然后打开 Variables and Secrets。</li>
          <li>4. 添加 Secret，变量名填写 ADMIN_TOKEN，值填写一段足够长的随机字符串。</li>
          <li>5. 保存并部署后回到此页，点击“重新检测”。</li>
        </ol>
      )}
    </div>
  );
}

function orderedSetupSteps(status?: SetupStatusDto) {
  return SETUP_STEP_ORDER.map((key) => status?.steps.find((step) => step.key === key)).filter((step): step is SetupStep => Boolean(step));
}

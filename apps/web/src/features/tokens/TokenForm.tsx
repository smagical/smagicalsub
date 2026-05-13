import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import type { NodeDto, ProfileDto, ProfileModuleDto, ProfileModuleFormat, ProfileModuleType } from "@smagicalsub/shared";
import { CheckCircle2, KeyRound, Layers3, Link2, Plus, Route, Sparkles } from "lucide-react";
import { CheckboxField } from "../../shared/CheckboxField";
import { DateTimePicker } from "../../shared/DateTimePicker";
import { FilterField } from "../../shared/FilterField";
import { TokenNodeSelector } from "./TokenNodeSelector";
import type { TokenEditFormState, TokenFormState } from "./types";
import { tokenModuleFormats } from "./types";

const selectableModuleTypes = [
  { label: "DNS", value: "dns" },
  { label: "入站", value: "inbound" },
  { label: "TUN", value: "tun" },
  { label: "规则集", value: "rule-provider" },
  { label: "代理集", value: "proxy-provider" },
  { label: "观测", value: "observatory" },
  { label: "高级覆盖", value: "advanced-override" }
] as const;

const supportedModuleTypesByFormat: Record<ProfileModuleFormat, ProfileModuleType[]> = {
  clash: ["dns", "inbound", "tun", "rule-provider", "proxy-provider", "advanced-override"],
  common: ["dns", "inbound", "tun", "advanced-override"],
  "sing-box": ["dns", "inbound", "tun", "rule-provider", "observatory", "advanced-override"],
  xray: ["dns", "inbound", "tun", "rule-provider", "observatory", "advanced-override"]
};
import { toCreateTokenInput } from "./utils";

type TokenFormProps = {
  form: TokenFormState;
  nodes: NodeDto[];
  pending: boolean;
  profileModules: ProfileModuleDto[];
  profiles: ProfileDto[];
  setForm: Dispatch<SetStateAction<TokenFormState>>;
  onSubmit: (value: ReturnType<typeof toCreateTokenInput>) => void;
};

export function TokenForm({ form, nodes, pending, profileModules, profiles, setForm, onSubmit }: TokenFormProps) {
  const [open, setOpen] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(toCreateTokenInput(form));
    setOpen(false);
  }

  return (
    <section className="grid gap-3 rounded-xl border bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-2">
          <Badge className="w-fit gap-1.5 border-chart-2/30 bg-chart-2/10 text-chart-2" variant="outline">
            <Sparkles />
            令牌入口
          </Badge>
          <div className="grid gap-1">
            <h3 className="text-base font-semibold leading-tight">创建新的订阅令牌</h3>
            <p className="max-w-xl text-xs leading-5 text-muted-foreground">
              创建时设置配置档、订阅路径和节点范围，生成后可在令牌列表继续复制、预览和维护。
            </p>
          </div>
        </div>
        <Button className="shrink-0" disabled={pending} onClick={() => setOpen(true)} type="button" variant="info">
          <Plus data-icon="inline-start" />
          创建令牌
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <TokenFormHint icon={KeyRound} label="配置档" value={selectedProfileLabel(form.profile_id, profiles)} />
        <TokenFormHint icon={Route} label="节点范围" value={nodeScopeLabel(form.node_ids)} />
        <TokenFormHint icon={Link2} label="订阅路径" value={pathPreview(form.custom_path)} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(94vw,920px)] max-h-[92dvh] gap-3 p-4">
          <DialogHeader>
            <DialogTitle>创建订阅令牌</DialogTitle>
            <DialogDescription>设置名称、绑定配置档、节点范围和订阅路径，保存后会生成可复制的订阅地址。</DialogDescription>
          </DialogHeader>
          <form className="contents" onSubmit={handleSubmit}>
            <DialogBody className="min-h-0 gap-3">
              <TokenFormFields
                form={form}
                nodes={nodes}
                pending={pending}
                profileModules={profileModules}
                profiles={profiles}
                onFormChange={(nextForm) => setForm(nextForm)}
              />
            </DialogBody>
            <DialogFooter>
              <Button disabled={pending} onClick={() => setOpen(false)} type="button" variant="outline">
                取消
              </Button>
              <Button disabled={pending} type="submit" variant="info">
                <Plus data-icon="inline-start" />
                创建令牌
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function TokenEditForm({
  form,
  nodes,
  pending,
  profileModules,
  profiles,
  onFormChange
}: {
  form: TokenEditFormState;
  nodes: NodeDto[];
  pending: boolean;
  profileModules: ProfileModuleDto[];
  profiles: ProfileDto[];
  onFormChange: (form: TokenEditFormState) => void;
}) {
  return <TokenFormFields form={form} nodes={nodes} pending={pending} profileModules={profileModules} profiles={profiles} onFormChange={onFormChange} />;
}

function TokenFormFields<TForm extends TokenEditFormState | TokenFormState>({
  form,
  nodes,
  pending,
  profileModules,
  profiles,
  onFormChange
}: {
  form: TForm;
  nodes: NodeDto[];
  pending: boolean;
  profileModules: ProfileModuleDto[];
  profiles: ProfileDto[];
  onFormChange: (form: TForm) => void;
}) {
  return (
    <div className="grid gap-3">
      <section className="rounded-xl border bg-card p-3">
        <div className="mb-3 flex items-start justify-between gap-3 border-b pb-2">
          <div className="grid gap-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-chart-2">
              <KeyRound />
              令牌基础
            </div>
            <p className="text-xs text-muted-foreground">每个令牌可绑定一个配置档，用该配置档的策略和规则生成订阅。</p>
          </div>
          <Badge className={form.enabled ? "border-chart-3/30 bg-chart-3/10 text-chart-3" : "border-destructive/30 bg-destructive/10 text-destructive"} variant="outline">
            {form.enabled ? "启用中" : "已停用"}
          </Badge>
        </div>

        <div className="grid items-start gap-2.5 md:grid-cols-2">
          <FilterField className="self-start" label="名称">
            <Input
              disabled={pending}
              onChange={(event) => onFormChange({ ...form, name: event.target.value })}
              placeholder="默认订阅"
              required
              type="text"
              value={form.name}
            />
          </FilterField>
          <FilterField className="self-start" label="绑定配置档">
            <NativeSelect disabled={pending} onChange={(event) => onFormChange({ ...form, profile_id: event.target.value })} value={form.profile_id}>
              <option value="">不绑定</option>
              {profiles.map((profile) => (
                <option disabled={!profile.enabled} key={profile.id} value={profile.id}>
                  {profile.enabled ? profile.name : `${profile.name}（停用）`}
                </option>
              ))}
            </NativeSelect>
          </FilterField>
          <FilterField className="self-start" label="过期时间">
            <DateTimePicker
              ariaLabel="令牌过期时间"
              disabled={pending}
              onChange={(expires_at) => onFormChange({ ...form, expires_at })}
              value={form.expires_at}
            />
          </FilterField>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2.5">
            <p className="flex min-w-[190px] flex-1 items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="text-chart-3" />
              <span>启用后可访问；停用后拒绝请求。</span>
            </p>
            <CheckboxField
              checked={form.enabled}
              className="min-h-7 shrink-0"
              disabled={pending}
              label="启用"
              onCheckedChange={(enabled) => onFormChange({ ...form, enabled })}
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-3">
        <div className="mb-3 flex items-start justify-between gap-3 border-b pb-2">
          <div className="grid gap-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-chart-5">
              <Layers3 />
              输出模块
            </div>
            <p className="text-xs text-muted-foreground">按输出格式选择 DNS、入站、TUN、规则集等模块；留空时自动使用配置档或系统默认模块。</p>
          </div>
          <Badge variant="outline">已选 {form.module_bindings.length}</Badge>
        </div>
        <TokenModuleBindings
          disabled={pending}
          form={form}
          profileModules={profileModules}
          onFormChange={onFormChange}
        />
      </section>

      <section className="rounded-xl border bg-card p-3">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="grid gap-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Route />
              范围与路径
            </div>
            <p className="text-xs text-muted-foreground">自定义路径会覆盖默认地址；节点范围为空时输出全部启用节点。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{nodeScopeLabel(form.node_ids)}</Badge>
            <Badge variant={form.custom_path.trim() ? "secondary" : "outline"}>
              <Link2 />
              {pathPreview(form.custom_path)}
            </Badge>
          </div>
        </div>
        <div className="grid gap-3">
          <FilterField className="self-start" label="自定义路径">
            <Input
              disabled={pending}
              onChange={(event) => onFormChange({ ...form, custom_path: event.target.value })}
              placeholder="my-sub"
              type="text"
              value={form.custom_path}
            />
          </FilterField>
          <FilterField className="self-start" label="订阅节点">
            <TokenNodeSelector
              disabled={pending}
              nodes={nodes}
              selectedIds={form.node_ids}
              onChange={(node_ids) => onFormChange({ ...form, node_ids })}
            />
          </FilterField>
        </div>
      </section>
    </div>
  );
}

function TokenModuleBindings<TForm extends TokenEditFormState | TokenFormState>({
  disabled,
  form,
  profileModules,
  onFormChange
}: {
  disabled: boolean;
  form: TForm;
  profileModules: ProfileModuleDto[];
  onFormChange: (form: TForm) => void;
}) {
  const commonFormat = tokenModuleFormats.find((format) => format.value === "common");
  const dedicatedFormats = tokenModuleFormats.filter((format) => format.value !== "common");

  return (
    <div className="grid gap-3">
      {commonFormat ? (
        <ModuleBindingGroup
          description="通用模块会作为所有输出格式的基础配置。格式专用模块存在时，会在通用模块之后覆盖。"
          disabled={disabled}
          format={commonFormat}
          form={form}
          profileModules={profileModules}
          title="通用覆盖"
          onFormChange={onFormChange}
        />
      ) : null}
      <div className="grid gap-2 xl:grid-cols-3">
        {dedicatedFormats.map((format) => (
          <ModuleBindingGroup
            description="只覆盖该客户端输出。"
            disabled={disabled}
            format={format}
            form={form}
            key={format.value}
            profileModules={profileModules}
            title={`${format.label} 专用`}
            onFormChange={onFormChange}
          />
        ))}
      </div>
    </div>
  );
}

function ModuleBindingGroup<TForm extends TokenEditFormState | TokenFormState>({
  description,
  disabled,
  format,
  form,
  profileModules,
  title,
  onFormChange
}: {
  description: string;
  disabled: boolean;
  format: { label: string; value: ProfileModuleFormat };
  form: TForm;
  profileModules: ProfileModuleDto[];
  title: string;
  onFormChange: (form: TForm) => void;
}) {
  const supportedTypes = selectableModuleTypes.filter((moduleType) => supportedModuleTypesByFormat[format.value].includes(moduleType.value));
  const selectedCount = supportedTypes.filter((moduleType) =>
    form.module_bindings.some((item) => item.format === format.value && item.type === moduleType.value)
  ).length;
  const columnClassName = format.value === "common" ? "grid gap-1.5 md:grid-cols-2 2xl:grid-cols-3" : "grid gap-1.5";

  return (
    <div className="grid gap-2 rounded-xl border bg-background/65 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h4 className="truncate text-sm font-semibold leading-tight">{title}</h4>
          <span className="hidden truncate text-xs text-muted-foreground min-[520px]:block">{description}</span>
        </div>
        <Badge className="shrink-0" variant={selectedCount > 0 ? "secondary" : "outline"}>{selectedCount}/{supportedTypes.length}</Badge>
      </div>
      <div className={columnClassName}>
        {supportedTypes.map((moduleType) => (
          <ModuleBindingSelect
            disabled={disabled}
            format={format.value}
            form={form}
            key={`${format.value}-${moduleType.value}`}
            moduleType={moduleType}
            profileModules={profileModules}
            onFormChange={onFormChange}
          />
        ))}
      </div>
    </div>
  );
}

function ModuleBindingSelect<TForm extends TokenEditFormState | TokenFormState>({
  disabled,
  format,
  form,
  moduleType,
  profileModules,
  onFormChange
}: {
  disabled: boolean;
  format: ProfileModuleFormat;
  form: TForm;
  moduleType: { label: string; value: ProfileModuleType };
  profileModules: ProfileModuleDto[];
  onFormChange: (form: TForm) => void;
}) {
  const binding = form.module_bindings.find((item) => item.format === format && item.type === moduleType.value);
  const options = profileModules.filter((module) => Boolean(module.enabled) && module.format === format && module.type === moduleType.value);

  return (
    <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-2 rounded-lg border bg-card/70 px-2 py-1.5">
      <span className="truncate text-xs font-medium text-muted-foreground">{moduleType.label}</span>
      <NativeSelect
        className="h-8 min-w-0 text-xs"
        disabled={disabled}
        onChange={(event) => {
          const moduleId = event.target.value;
          const nextBindings = form.module_bindings.filter((item) => !(item.format === format && item.type === moduleType.value));

          onFormChange({
            ...form,
            module_bindings: moduleId
              ? [...nextBindings, { format, module_id: moduleId, type: moduleType.value }]
              : nextBindings
          });
        }}
        value={binding?.module_id ?? ""}
      >
        <option value="">自动选择默认模块</option>
        {options.map((module) => (
          <option key={module.id} value={module.id}>
            {module.name}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}

function TokenFormHint({ icon: Icon, label, value }: { icon: typeof KeyRound; label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-background/70 px-2.5 py-2">
      <span className="rounded-md border border-chart-2/20 bg-chart-2/10 p-1.5 text-chart-2">
        <Icon />
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className="truncate text-xs font-semibold">{value}</span>
      </span>
    </div>
  );
}

function nodeScopeLabel(nodeIds: string[]) {
  return nodeIds.length === 0 ? "全部节点" : `${nodeIds.length} 个节点`;
}

function pathPreview(customPath: string) {
  const value = customPath.trim();
  return value ? `/sub/${value}` : "自动路径";
}

function selectedProfileLabel(profileId: string, profiles: ProfileDto[]) {
  return profiles.find((profile) => profile.id === profileId)?.name ?? "不绑定";
}

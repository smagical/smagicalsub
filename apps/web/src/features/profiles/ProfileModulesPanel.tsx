import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ListPagination } from "../../shared/ListPagination";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CreateProfileModuleInput, ProfileDto, ProfileModuleDto, ProfileModuleFormat, ProfileModuleType, UpdateProfileModuleInput } from "@smagicalsub/shared";
import type { LucideIcon } from "lucide-react";
import { Cable, FileJson2, Globe2, Layers3, Plus, Save, Search, ShieldCheck, Trash2 } from "lucide-react";
import { FilterField } from "../../shared/FilterField";

type ProfileModulesPanelProps = {
  modules: ProfileModuleDto[];
  pending: boolean;
  profiles: ProfileDto[];
  onCreate: (input: CreateProfileModuleInput) => void;
  onDelete: (module: ProfileModuleDto) => void;
  onUpdate: (module: ProfileModuleDto, input: UpdateProfileModuleInput) => void;
};

type ModuleFormState = {
  content: string;
  enabled: boolean;
  format: ProfileModuleFormat;
  is_default: boolean;
  name: string;
  profile_id: string;
  type: ProfileModuleType;
};

type ModuleFormSetter = (next: ModuleFormState | ((current: ModuleFormState) => ModuleFormState)) => void;

type ModuleTabKey = "default" | ProfileModuleFormat;

const initialModuleForm: ModuleFormState = {
  content: "{}",
  enabled: true,
  format: "common",
  is_default: false,
  name: "",
  profile_id: "",
  type: "dns"
};

const moduleFormats: Array<{ description: string; label: string; value: ProfileModuleFormat }> = [
  { description: "所有输出都可复用，适合 DNS、入站端口等共性设置。", label: "通用", value: "common" },
  { description: "仅覆盖 Clash/Mihomo YAML 输出，适合 allow-lan、fake-ip 等字段。", label: "Clash", value: "clash" },
  { description: "仅覆盖 sing-box JSON 输出，适合 DNS server、inbounds、route 扩展。", label: "sing-box", value: "sing-box" },
  { description: "仅覆盖 Xray-core JSON 输出，适合 dns、inbounds、routing 扩展。", label: "Xray", value: "xray" }
];

const moduleTypes: Array<{ label: string; value: ProfileModuleType }> = [
  { label: "DNS 表单", value: "dns" },
  { label: "入站表单", value: "inbound" },
  { label: "TUN 模块", value: "tun" },
  { label: "规则集模块", value: "rule-provider" },
  { label: "代理集模块", value: "proxy-provider" },
  { label: "观测模块", value: "observatory" },
  { label: "高级覆盖", value: "advanced-override" }
];

const moduleTabDefinitions: Array<{ description: string; icon: LucideIcon; label: string; value: ModuleTabKey }> = [
  { description: "不绑定配置档，作为全局兜底模块。", icon: ShieldCheck, label: "默认", value: "default" },
  { description: "所有输出都可复用的通用模块。", icon: Layers3, label: "通用", value: "common" },
  { description: "仅覆盖 Clash / Mihomo 输出。", icon: FileJson2, label: "Clash", value: "clash" },
  { description: "仅覆盖 sing-box 输出。", icon: Cable, label: "sing-box", value: "sing-box" },
  { description: "仅覆盖 Xray 输出。", icon: Globe2, label: "Xray", value: "xray" }
];

const modulePageSize = 6;

const defaultDnsContent = {
  enable: true,
  enhancedMode: "fake-ip",
  fakeIp: false,
  fakeIpFilter: ["*.lan", "localhost.ptlogin2.qq.com"],
  fallback: [],
  final: "",
  hosts: {},
  servers: ["https://dns.alidns.com/dns-query", "https://cloudflare-dns.com/dns-query"],
  strategy: ""
};

const defaultInboundContent = {
  allowLan: false,
  inboundType: "mixed",
  listen: "127.0.0.1",
  port: 2080,
  sniff: true,
  tag: "mixed-in",
  udp: true
};

const defaultTunContent = {
  address: ["172.19.0.1/30"],
  autoRoute: true,
  dnsHijack: ["any:53"],
  enable: true,
  mtu: 9000,
  sniff: true,
  stack: "mixed",
  strictRoute: false,
  tag: "tun-in"
};

// 不同输出端对 DNS 解析策略字段命名不同，表单按格式显示对应选项。
const singBoxDnsStrategyOptions = [
  { label: "默认/不设置", value: "" },
  { label: "优先 IPv4 (prefer_ipv4)", value: "prefer_ipv4" },
  { label: "优先 IPv6 (prefer_ipv6)", value: "prefer_ipv6" },
  { label: "仅 IPv4 (ipv4_only)", value: "ipv4_only" },
  { label: "仅 IPv6 (ipv6_only)", value: "ipv6_only" }
];

const xrayDnsStrategyOptions = [
  { label: "默认/不设置", value: "" },
  { label: "Xray UseIP", value: "UseIP" },
  { label: "Xray UseIPv4", value: "UseIPv4" },
  { label: "Xray UseIPv6", value: "UseIPv6" },
  { label: "Xray UseSystem", value: "UseSystem" }
];

const clashRuleProviderTypes = [
  { label: "远程 HTTP", value: "http" },
  { label: "本地文件", value: "file" }
];

const clashRuleBehaviors = [
  { label: "domain", value: "domain" },
  { label: "ipcidr", value: "ipcidr" },
  { label: "classical", value: "classical" }
];

const clashRuleFormats = [
  { label: "yaml", value: "yaml" },
  { label: "text", value: "text" },
  { label: "mrs", value: "mrs" }
];

const singBoxRuleSetTypes = [
  { label: "远程 remote", value: "remote" },
  { label: "本地 local", value: "local" },
  { label: "内联 inline", value: "inline" }
];

const singBoxRuleSetFormats = [
  { label: "source", value: "source" },
  { label: "binary", value: "binary" }
];

const xrayDomainStrategies = [
  { label: "AsIs", value: "AsIs" },
  { label: "IPIfNonMatch", value: "IPIfNonMatch" },
  { label: "IPOnDemand", value: "IPOnDemand" }
];

const moduleDnsHints: Record<ProfileModuleFormat, string> = {
  clash: "Clash/Mihomo 使用 nameserver、fallback、fake-ip-filter；增强模式只保留 fake-ip / redir-host。",
  common: "通用 DNS 只维护服务器、hosts 等可复用字段；sing-box/Xray 的策略建议在专用模块里设置。",
  "sing-box": "sing-box 使用新版 DNS server 对象，final 指向 server tag，可使用 type/server/tag/detour 等字段。",
  xray: "Xray 使用 servers 字符串或对象，策略字段是 queryStrategy，可配置 domains、expectIPs、skipFallback 等对象字段。"
};

export function ProfileModulesPanel({ modules, pending, profiles, onCreate, onDelete, onUpdate }: ProfileModulesPanelProps) {
  const [form, setForm] = useState(initialModuleForm);
  const [activeFormat, setActiveFormat] = useState<ProfileModuleFormat>("common");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ProfileModuleDto | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [activeTab, setActiveTab] = useState<ModuleTabKey>("default");
  const [moduleSearchByTab, setModuleSearchByTab] = useState<Record<ModuleTabKey, string>>({
    clash: "",
    common: "",
    default: "",
    "sing-box": "",
    xray: ""
  });
  const [pageByTab, setPageByTab] = useState<Record<ModuleTabKey, number>>({
    clash: 1,
    common: 1,
    default: 1,
    "sing-box": 1,
    xray: 1
  });
  const moduleStats = useMemo(() => ({
    common: modules.filter((module) => module.format === "common").length,
    clash: modules.filter((module) => module.format === "clash").length,
    defaults: modules.filter((module) => module.is_default).length,
    singbox: modules.filter((module) => module.format === "sing-box").length,
    xray: modules.filter((module) => module.format === "xray").length
  }), [modules]);
  const activeSearch = activeTab === "default" ? "" : moduleSearchByTab[activeTab];
  const activeModules = useMemo(() => filterProfileModules(modulesForTab(modules, activeTab), activeSearch), [activeSearch, activeTab, modules]);
  const activePage = pageByTab[activeTab];
  const paginatedModules = useMemo(
    () => activeModules.slice((activePage - 1) * modulePageSize, activePage * modulePageSize),
    [activeModules, activePage]
  );

  useEffect(() => {
    setPageByTab((current) => {
      const next = { ...current } as Record<ModuleTabKey, number>;
      let changed = false;

      for (const tab of moduleTabDefinitions) {
        const tabSearch = tab.value === "default" ? "" : moduleSearchByTab[tab.value];
        const pageCount = Math.max(1, Math.ceil(filterProfileModules(modulesForTab(modules, tab.value), tabSearch).length / modulePageSize));
        const clamped = Math.min(Math.max(next[tab.value] ?? 1, 1), pageCount);
        if (clamped !== next[tab.value]) {
          next[tab.value] = clamped;
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [moduleSearchByTab, modules]);

  function createModule() {
    const parsed = parseJsonObject(form.content);

    if (!parsed) {
      return;
    }

    onCreate({
      content: parsed,
      enabled: form.enabled,
      format: form.format,
      is_default: form.is_default,
      name: form.name.trim(),
      profile_id: form.profile_id || null,
      type: form.type
    });
    setForm(initialModuleForm);
    setActiveFormat("common");
    setCreateOpen(false);
  }

  function startEdit(module: ProfileModuleDto) {
    setEditingModule(module);
    setEditingContent(JSON.stringify(module.content, null, 2));
  }

  function saveEdit() {
    if (!editingModule) {
      return;
    }

    const parsed = parseJsonObject(editingContent);

    if (!parsed) {
      return;
    }

    onUpdate(editingModule, { content: parsed });
    setEditingModule(null);
    setEditingContent("");
  }

  function changeTab(tab: ModuleTabKey) {
    setActiveTab(tab);
  }

  function changePage(page: number) {
    setPageByTab((current) => ({ ...current, [activeTab]: page }));
  }

  function changeModuleSearch(tab: ModuleTabKey, value: string) {
    setModuleSearchByTab((current) => ({ ...current, [tab]: value }));
    setPageByTab((current) => ({ ...current, [tab]: 1 }));
  }

  return (
    <section className="grid gap-3 rounded-xl border bg-card p-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="grid gap-2">
          <Badge className="w-fit gap-1.5 border-chart-5/30 bg-chart-5/10 text-chart-5" variant="outline">
            <Layers3 />
            配置模块
          </Badge>
          <h3 className="text-base font-semibold leading-tight">通用与端侧配置模块</h3>
          <p className="text-xs leading-5 text-muted-foreground">
            通用模块写一次即可复用；Clash、sing-box、Xray 专用模块会在输出时覆盖通用模块，未配置时走配置档或全局默认。
          </p>
          <div className="grid gap-1.5 sm:grid-cols-3 xl:grid-cols-5">
            <ModuleStat label="通用" value={moduleStats.common} />
            <ModuleStat label="Clash" value={moduleStats.clash} />
            <ModuleStat label="sing-box" value={moduleStats.singbox} />
            <ModuleStat label="Xray" value={moduleStats.xray} />
            <ModuleStat label="默认" value={moduleStats.defaults} />
          </div>
        </div>
        <div className="grid gap-2 rounded-xl border bg-background/65 p-3 lg:w-72">
          <div className="flex items-center gap-2 text-sm font-semibold text-chart-5">
            <ShieldCheck />
            模块工作流
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            先创建通用模块，再按 Clash、sing-box、Xray 补充差异字段；令牌输出时会自动合并。
          </p>
          <Button className="w-full justify-center" disabled={pending} onClick={() => setCreateOpen(true)} type="button" variant="info">
            <Plus data-icon="inline-start" />
            创建模块
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        {modules.length === 0 ? (
          <div className="grid min-h-40 place-items-center rounded-xl border bg-background/65 p-4 text-center text-sm text-muted-foreground">
            还没有配置模块。可以先创建 sing-box 或 Xray 的高级覆盖模块。
          </div>
        ) : (
          <>
            <div className="grid gap-2 rounded-xl border bg-background/65 p-2">
              <Tabs className="gap-3" value={activeTab} onValueChange={(value) => changeTab(value as ModuleTabKey)}>
                <TabsList className="w-full flex-wrap justify-start" variant="line">
                  {moduleTabDefinitions.map((tab) => {
                    const count = modulesForTab(modules, tab.value).length;

                    return (
                      <TabsTrigger className="min-w-0 px-2.5 text-xs" key={tab.value} value={tab.value}>
                        <tab.icon data-icon="inline-start" />
                        <span className="truncate">{tab.label}</span>
                        <Badge className="ml-1.5 h-4 px-1.5 text-[10px]" variant="outline">
                          {count}
                        </Badge>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {moduleTabDefinitions.map((tab) => {
                  const tabSearch = tab.value === "default" ? "" : moduleSearchByTab[tab.value];
                  const rawTabModules = modulesForTab(modules, tab.value);
                  const tabModules = filterProfileModules(rawTabModules, tabSearch);
                  const currentPage = pageByTab[tab.value];
                  const pageCount = Math.max(1, Math.ceil(tabModules.length / modulePageSize));
                  const pageModules = tab.value === activeTab ? paginatedModules : tabModules.slice((currentPage - 1) * modulePageSize, currentPage * modulePageSize);

                  return (
                    <TabsContent className="m-0 grid gap-2" key={tab.value} value={tab.value}>
                      <div className="grid gap-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card/60 px-2.5 py-1.5">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold">{tab.label} 模块</div>
                            <div className="truncate text-xs text-muted-foreground">{tab.description}</div>
                          </div>
                          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
                            {tab.value === "default" ? null : (
                              <ModuleTabSearch
                                count={tabModules.length}
                                total={rawTabModules.length}
                                value={tabSearch}
                                onChange={(value) => changeModuleSearch(tab.value, value)}
                              />
                            )}
                            <Badge className="shrink-0" variant="outline">{tabModules.length} 个</Badge>
                          </div>
                        </div>
                        {tabModules.length === 0 ? (
                          <div className="rounded-lg border border-dashed bg-card/55 p-3 text-xs leading-5 text-muted-foreground">
                            {tabSearch.trim() ? "当前搜索没有匹配模块。" : "当前分类没有模块。"}
                          </div>
                        ) : (
                          <div className="grid gap-2">
                            {pageModules.map((module) => (
                              <ModuleCard
                                key={module.id}
                                module={module}
                                pending={pending}
                                onDelete={onDelete}
                                onStartEdit={startEdit}
                                onUpdate={onUpdate}
                              />
                            ))}
                          </div>
                        )}
                        <ListPagination
                          currentPage={currentPage}
                          label={`${tab.label} 模块`}
                          onPageChange={(page) => {
                            if (tab.value === activeTab) {
                              changePage(page);
                              return;
                            }

                            setPageByTab((current) => ({ ...current, [tab.value]: page }));
                          }}
                          pageCount={pageCount}
                          pageSize={modulePageSize}
                          pageSizeOptions={[modulePageSize]}
                          className="rounded-lg bg-card/55 px-2 py-1"
                          total={tabModules.length}
                        />
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </div>
          </>
        )}
      </div>
      <ModuleCreateDialog
        activeFormat={activeFormat}
        form={form}
        open={createOpen}
        pending={pending}
        profiles={profiles}
        onActiveFormatChange={setActiveFormat}
        onCreate={createModule}
        onFormChange={setForm}
        onOpenChange={setCreateOpen}
      />
      <ModuleEditDialog
        content={editingContent}
        module={editingModule}
        pending={pending}
        onContentChange={setEditingContent}
        onOpenChange={(open) => {
          if (!open) {
            setEditingModule(null);
            setEditingContent("");
          }
        }}
        onSave={saveEdit}
      />
    </section>
  );
}

function ModuleStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border bg-background/65 px-2.5 py-1.5">
      <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
      <strong className="text-sm font-semibold">{value}</strong>
    </div>
  );
}

function ModuleTabSearch({
  count,
  total,
  value,
  onChange
}: {
  count: number;
  total: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-[220px] max-w-sm flex-1 items-center gap-2 rounded-md border bg-background/70 px-2">
      <Search className="shrink-0 text-muted-foreground" data-icon="inline-start" />
      <Input
        aria-label="搜索当前模块分类"
        className="h-7 min-w-0 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索名称、类型、配置档或内容"
        value={value}
      />
      {value.trim() ? (
        <Badge className="shrink-0 px-1.5 text-[10px]" variant="outline">
          {count}/{total}
        </Badge>
      ) : null}
    </div>
  );
}

// 创建弹窗只维护模块草稿，实际创建仍由父组件统一触发列表刷新。
function ModuleCreateDialog({
  activeFormat,
  form,
  open,
  pending,
  profiles,
  onActiveFormatChange,
  onCreate,
  onFormChange,
  onOpenChange
}: {
  activeFormat: ProfileModuleFormat;
  form: ModuleFormState;
  open: boolean;
  pending: boolean;
  profiles: ProfileDto[];
  onActiveFormatChange: (format: ProfileModuleFormat) => void;
  onCreate: () => void;
  onFormChange: ModuleFormSetter;
  onOpenChange: (open: boolean) => void;
}) {
  const activeFormatInfo = moduleFormats.find((format) => format.value === activeFormat) ?? moduleFormats[0];
  const parsed = parseJsonObject(form.content);

  function patch(next: Partial<ModuleFormState>) {
    onFormChange((current) => {
      const merged = { ...current, ...next };
      return merged.is_default ? { ...merged, profile_id: "" } : merged;
    });
  }

  function selectFormat(format: ProfileModuleFormat) {
    onActiveFormatChange(format);
    patch({ content: defaultContentForFormat(form.type, format), format });
  }

  function selectType(type: ProfileModuleType) {
    patch({ content: defaultContentForFormat(type, form.format), type });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,980px)] max-h-[92dvh] gap-3 p-4">
        <DialogHeader>
          <DialogTitle>创建配置模块</DialogTitle>
          <DialogDescription>按通用、Clash、sing-box、Xray 拆分差异配置；复杂字段可以在 JSON 内容里继续补充。</DialogDescription>
        </DialogHeader>
        <DialogBody className="min-h-0 gap-3">
          <div className="grid gap-2 rounded-xl border bg-background/65 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-chart-5">
              <ShieldCheck />
              模块分区
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {moduleFormats.map((format) => (
                <Button
                  className="h-auto justify-start whitespace-normal px-2.5 py-2 text-left"
                  disabled={pending}
                  key={format.value}
                  onClick={() => selectFormat(format.value)}
                  type="button"
                  variant={form.format === format.value ? "info" : "outline"}
                >
                  <span className="grid min-w-0 gap-0.5">
                    <span className="text-xs font-semibold">{format.label}</span>
                    <span className="line-clamp-2 text-[11px] leading-4 text-muted-foreground">{format.description}</span>
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 rounded-xl border bg-background/65 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <FilterField className="min-w-0" label="模块名称">
                <Input
                  disabled={pending}
                  onChange={(event) => patch({ name: event.target.value })}
                  placeholder={`${activeFormatInfo.label} DNS 覆盖`}
                  value={form.name}
                />
              </FilterField>
              <FilterField className="min-w-0" label="目标格式">
                <NativeSelect disabled={pending} onChange={(event) => selectFormat(event.target.value as ProfileModuleFormat)} value={form.format}>
                  {moduleFormats.map((format) => (
                    <option key={format.value} value={format.value}>{format.label}</option>
                  ))}
                </NativeSelect>
              </FilterField>
              <FilterField className="min-w-0" label="模块类型">
                <NativeSelect disabled={pending} onChange={(event) => selectType(event.target.value as ProfileModuleType)} value={form.type}>
                  {moduleTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </NativeSelect>
              </FilterField>
              <FilterField className="min-w-0" label="绑定配置档">
                <NativeSelect disabled={pending || form.is_default} onChange={(event) => patch({ profile_id: event.target.value })} value={form.is_default ? "" : form.profile_id}>
                  <option value="">系统默认/全局</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>{profile.name}</option>
                  ))}
                </NativeSelect>
              </FilterField>
            </div>
            <div className="flex flex-wrap gap-2">
              <ToggleBox checked={form.enabled} disabled={pending} label="启用" onChange={(enabled) => patch({ enabled })} />
              <ToggleBox checked={form.is_default} disabled={pending} label="默认模块" onChange={(is_default) => patch({ is_default })} />
            </div>
            {form.is_default ? (
              <p className="text-xs text-muted-foreground">默认模块会自动独立为全局兜底，不绑定任何配置档；保存后同格式同类型的旧默认会自动取消。</p>
            ) : null}
          </div>

            <ModuleContentEditor content={form.content} disabled={pending} format={form.format} type={form.type} onChange={(content) => patch({ content })} />
          <FilterField className="min-w-0" label="JSON 内容">
            <Textarea
              className="min-h-36 font-mono text-xs"
              disabled={pending}
              onChange={(event) => patch({ content: event.target.value })}
              placeholder='{"dns":{"enable":true}}'
              value={form.content}
            />
          </FilterField>
        </DialogBody>
        <DialogFooter>
          <Button disabled={pending} onClick={() => onOpenChange(false)} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending || !form.name.trim() || !parsed} onClick={onCreate} type="button" variant="info">
            <Plus data-icon="inline-start" />
            创建模块
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModuleCard({
  module,
  pending,
  onDelete,
  onStartEdit,
  onUpdate
}: {
  module: ProfileModuleDto;
  pending: boolean;
  onDelete: (module: ProfileModuleDto) => void;
  onStartEdit: (module: ProfileModuleDto) => void;
  onUpdate: (module: ProfileModuleDto, input: UpdateProfileModuleInput) => void;
}) {
  return (
    <article className="rounded-lg border bg-card/75 px-2.5 py-1.5">
      <div className="grid gap-1.5 xl:grid-cols-[minmax(230px,1fr)_minmax(0,1.05fr)_auto] xl:items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h4 className="truncate text-sm font-semibold">{module.name}</h4>
          <Badge variant="outline">{moduleTypeLabel(module.type)}</Badge>
          <Badge variant={module.enabled ? "outline" : "destructive"}>{module.enabled ? "启用" : "停用"}</Badge>
          {module.is_default ? <Badge variant="outline">默认</Badge> : null}
          <span className="min-w-0 truncate text-xs text-muted-foreground">{module.is_default ? "默认模块/全局兜底" : module.profile_name ? `绑定：${module.profile_name}` : "未绑定配置档"}</span>
        </div>
        <ModuleSummary module={module} />
        <div className="flex flex-nowrap items-center justify-end gap-1.5">
          <Button disabled={pending} onClick={() => onUpdate(module, { enabled: !module.enabled })} size="xs" type="button" variant={module.enabled ? "warning" : "success"}>
            {module.enabled ? "停用" : "启用"}
          </Button>
          <Button disabled={pending} onClick={() => onUpdate(module, { is_default: !module.is_default, profile_id: module.is_default ? module.profile_id : null })} size="xs" type="button" variant="outline">
            {module.is_default ? "取消默认" : "默认"}
          </Button>
          <Button disabled={pending} onClick={() => onStartEdit(module)} size="xs" type="button" variant="outline">
            编辑
          </Button>
          <Button disabled={pending} onClick={() => onDelete(module)} size="xs" type="button" variant="destructive">
            <Trash2 data-icon="inline-start" />
            删
          </Button>
        </div>
      </div>
    </article>
  );
}

function ModuleSummary({ module }: { module: ProfileModuleDto }) {
  const items = summaryItemsForModule(module);

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
      {items.map((item) => (
        <button
          className="flex min-w-0 items-center gap-1.5 rounded-md border bg-background/70 px-1.5 py-0.5 text-left transition-colors hover:bg-muted/45"
          key={`${item.label}-${item.value}`}
          onClick={() => copyText(item.value)}
          title="点击复制"
          type="button"
        >
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{item.label}</span>
          <strong className="min-w-0 truncate text-xs font-semibold">{item.value || "未设置"}</strong>
        </button>
      ))}
    </div>
  );
}

function ModuleEditDialog({
  content,
  module,
  pending,
  onContentChange,
  onOpenChange,
  onSave
}: {
  content: string;
  module: ProfileModuleDto | null;
  pending: boolean;
  onContentChange: (content: string) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  const parsed = parseJsonObject(content);

  return (
    <Dialog open={Boolean(module)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,940px)] max-h-[92dvh] gap-3 p-4">
        <DialogHeader>
          <DialogTitle>{module ? `编辑模块：${module.name}` : "编辑配置模块"}</DialogTitle>
          <DialogDescription>使用表单维护常用字段；高级覆盖或复杂字段仍可直接编辑 JSON。</DialogDescription>
        </DialogHeader>
        <DialogBody className="min-h-0 gap-3">
          {module ? (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{module.format}</Badge>
                <Badge variant="secondary">{moduleTypeLabel(module.type)}</Badge>
                <Badge variant={module.enabled ? "outline" : "destructive"}>{module.enabled ? "启用" : "停用"}</Badge>
              </div>
              <ModuleContentEditor content={content} disabled={pending} format={module.format} type={module.type} onChange={onContentChange} />
              <FilterField className="min-w-0" label="JSON 内容">
                <Textarea
                  className="min-h-40 font-mono text-xs"
                  disabled={pending}
                  onChange={(event) => onContentChange(event.target.value)}
                  value={content}
                />
              </FilterField>
            </>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button disabled={pending} onClick={() => onOpenChange(false)} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending || !parsed} onClick={onSave} type="button" variant="info">
            <Save data-icon="inline-start" />
            保存模块
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModuleContentEditor({
  content,
  disabled,
  format,
  type,
  onChange
}: {
  content: string;
  disabled: boolean;
  format: ProfileModuleFormat;
  type: ProfileModuleType;
  onChange: (content: string) => void;
}) {
  if (type === "dns") {
    return <DnsEditor content={content} disabled={disabled} format={format} onChange={onChange} />;
  }

  if (type === "inbound") {
    return <InboundEditor content={content} disabled={disabled} onChange={onChange} />;
  }

  if (type === "tun") {
    return <TunEditor content={content} disabled={disabled} onChange={onChange} />;
  }

  if (type === "rule-provider") {
    return <RuleProviderEditor content={content} disabled={disabled} format={format} onChange={onChange} />;
  }

  if (type === "proxy-provider") {
    return <ProxyProviderEditor content={content} disabled={disabled} onChange={onChange} />;
  }

  if (type === "observatory") {
    return <ObservatoryEditor content={content} disabled={disabled} onChange={onChange} />;
  }

  return null;
}

function InboundEditor({ content, disabled, onChange }: { content: string; disabled: boolean; onChange: (content: string) => void }) {
  const inbound = parseJsonObject(content) ?? defaultInboundContent;

  function patch(next: Record<string, unknown>) {
    onChange(JSON.stringify({ ...inbound, ...next }, null, 2));
  }

  return (
    <div className="grid gap-3 rounded-xl border bg-card/70 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-chart-5">
        <Cable />
        入站参数
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <FilterField className="min-w-0" label="入站类型">
          <NativeSelect disabled={disabled} onChange={(event) => patch({ inboundType: event.target.value })} value={stringValue(inbound.inboundType) || "mixed"}>
            <option value="mixed">mixed</option>
            <option value="socks">socks</option>
            <option value="http">http</option>
          </NativeSelect>
        </FilterField>
        <FilterField className="min-w-0" label="入站标签">
          <Input disabled={disabled} onChange={(event) => patch({ tag: event.target.value })} placeholder="mixed-in" value={stringValue(inbound.tag)} />
        </FilterField>
        <FilterField className="min-w-0" label="监听地址">
          <Input disabled={disabled} onChange={(event) => patch({ listen: event.target.value })} placeholder="127.0.0.1" value={stringValue(inbound.listen)} />
        </FilterField>
        <FilterField className="min-w-0" label="监听端口">
          <Input
            disabled={disabled}
            min={1}
            max={65535}
            onChange={(event) => patch({ port: Number(event.target.value) })}
            type="number"
            value={String(numberValue(inbound.port) ?? 2080)}
          />
        </FilterField>
      </div>
      <div className="flex flex-wrap gap-2">
        <ToggleBox checked={Boolean(inbound.allowLan)} disabled={disabled} label="Clash 允许局域网" onChange={(allowLan) => patch({ allowLan })} />
        <ToggleBox checked={Boolean(inbound.udp ?? true)} disabled={disabled} label="UDP" onChange={(udp) => patch({ udp })} />
        <ToggleBox checked={Boolean(inbound.sniff ?? true)} disabled={disabled} label="嗅探" onChange={(sniff) => patch({ sniff })} />
      </div>
    </div>
  );
}

function TunEditor({ content, disabled, onChange }: { content: string; disabled: boolean; onChange: (content: string) => void }) {
  const tun = parseJsonObject(content) ?? defaultTunContent;

  function patch(next: Record<string, unknown>) {
    onChange(JSON.stringify({ ...tun, ...next }, null, 2));
  }

  return (
    <div className="grid gap-3 rounded-xl border bg-card/70 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-chart-5">
        <Cable />
        TUN 参数
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <FilterField className="min-w-0" label="TUN 标签">
          <Input disabled={disabled} onChange={(event) => patch({ tag: event.target.value })} placeholder="tun-in" value={stringValue(tun.tag)} />
        </FilterField>
        <FilterField className="min-w-0" label="协议栈">
          <NativeSelect disabled={disabled} onChange={(event) => patch({ stack: event.target.value })} value={stringValue(tun.stack) || "mixed"}>
            <option value="mixed">mixed</option>
            <option value="system">system</option>
            <option value="gvisor">gvisor</option>
          </NativeSelect>
        </FilterField>
        <FilterField className="min-w-0" label="地址/CIDR（每行一个）">
          <Textarea
            className="min-h-16 font-mono text-xs"
            disabled={disabled}
            onChange={(event) => patch({ address: fromLines(event.target.value) })}
            value={toLines(tun.address)}
          />
        </FilterField>
        <FilterField className="min-w-0" label="DNS 劫持（每行一个）">
          <Textarea
            className="min-h-16 font-mono text-xs"
            disabled={disabled}
            onChange={(event) => patch({ dnsHijack: fromLines(event.target.value) })}
            value={toLines(tun.dnsHijack ?? tun["dns-hijack" as keyof typeof tun])}
          />
        </FilterField>
        <FilterField className="min-w-0" label="MTU">
          <Input disabled={disabled} min={1} onChange={(event) => patch({ mtu: Number(event.target.value) })} type="number" value={String(numberValue(tun.mtu) ?? 9000)} />
        </FilterField>
      </div>
      <div className="flex flex-wrap gap-2">
        <ToggleBox checked={Boolean(tun.enable ?? true)} disabled={disabled} label="启用" onChange={(enable) => patch({ enable })} />
        <ToggleBox checked={Boolean(tun.autoRoute ?? tun["auto-route" as keyof typeof tun] ?? true)} disabled={disabled} label="自动路由" onChange={(autoRoute) => patch({ autoRoute })} />
        <ToggleBox checked={Boolean(tun.strictRoute ?? tun["strict-route" as keyof typeof tun])} disabled={disabled} label="严格路由" onChange={(strictRoute) => patch({ strictRoute })} />
        <ToggleBox checked={Boolean(tun.sniff ?? true)} disabled={disabled} label="嗅探" onChange={(sniff) => patch({ sniff })} />
      </div>
    </div>
  );
}

function RuleProviderEditor({
  content,
  disabled,
  format,
  onChange
}: {
  content: string;
  disabled: boolean;
  format: ProfileModuleFormat;
  onChange: (content: string) => void;
}) {
  const provider = parseJsonObject(content) ?? parseJsonObject(defaultContentFor("rule-provider")) ?? {};
  const ruleSet = Array.isArray(provider.rule_set) ? provider.rule_set : [];
  const firstRuleSet = objectRecord(ruleSet[0]);
  const routing = objectRecord(provider.routing);
  const xrayRulesSource = routing.rules ?? provider.rules;
  const xrayBalancersSource = routing.balancers ?? provider.balancers;
  const xrayRules = Array.isArray(xrayRulesSource) ? xrayRulesSource : [];
  const xrayBalancers = Array.isArray(xrayBalancersSource) ? xrayBalancersSource : [];

  function patch(next: Record<string, unknown>) {
    if (format === "sing-box") {
      const nextRuleSet = { ...firstRuleSet, ...next };
      onChange(JSON.stringify({ ...provider, rule_set: [compactObject(nextRuleSet)] }, null, 2));
      return;
    }

    if (format === "xray") {
      onChange(JSON.stringify({ ...provider, routing: compactObject({ ...routing, ...next }) }, null, 2));
      return;
    }

    const name = stringValue(next.name ?? provider.name) || "remote-rules";
    const currentEntry = objectRecord(provider[name]) ?? provider;
    const nextEntry = compactObject({ ...currentEntry, ...next });
    const contentValue = next.name && next.name !== provider.name ? { [String(next.name)]: nextEntry, name: next.name } : { ...provider, name, [name]: nextEntry };
    onChange(JSON.stringify(contentValue, null, 2));
  }

  const source = format === "sing-box" ? firstRuleSet : objectRecord(provider[stringValue(provider.name) || "remote-rules"]) ?? provider;

  if (format === "xray") {
    return (
      <div className="grid gap-3 rounded-xl border bg-card/70 p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-chart-5">
          <FileJson2 />
          Xray routing 参数
        </div>
        <p className="rounded-lg border bg-background/70 px-2.5 py-2 text-xs leading-5 text-muted-foreground">
          Xray 没有 Clash 那种 <span className="font-mono">rule-providers</span>。这里维护的是 <span className="font-mono">routing</span> 覆盖：<span className="font-mono">rules</span> 用于路由规则，<span className="font-mono">balancers</span> 用于负载均衡，<span className="font-mono">domainStrategy</span> 控制域名解析参与路由的方式。
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <FilterField className="min-w-0" label="domainStrategy">
            <NativeSelect disabled={disabled} onChange={(event) => patch({ domainStrategy: event.target.value })} value={stringValue(routing.domainStrategy ?? provider.domainStrategy) || "AsIs"}>
              {xrayDomainStrategies.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </NativeSelect>
          </FilterField>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border bg-background/70 px-2.5 py-2">
              <div className="text-[11px] font-medium text-muted-foreground">routing.rules</div>
              <div className="font-mono text-sm font-semibold">{xrayRules.length} 条</div>
            </div>
            <div className="rounded-lg border bg-background/70 px-2.5 py-2">
              <div className="text-[11px] font-medium text-muted-foreground">balancers</div>
              <div className="font-mono text-sm font-semibold">{xrayBalancers.length} 个</div>
            </div>
          </div>
        </div>
        <FilterField className="min-w-0" label="routing JSON">
          <Textarea
            className="min-h-28 font-mono text-xs"
            disabled={disabled}
            onChange={(event) => patch(parseJsonObject(event.target.value) ?? {})}
            value={JSON.stringify(routing, null, 2)}
          />
        </FilterField>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-xl border bg-card/70 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-chart-5">
        <FileJson2 />
        规则集参数
      </div>
      <p className="rounded-lg border bg-background/70 px-2.5 py-2 text-xs leading-5 text-muted-foreground">
        {format === "sing-box"
          ? "sing-box 这里写入 route.rule_set；remote 使用 url / download_detour / update_interval，local 使用 path，inline 可在 JSON 中直接补 rules。"
          : "Clash/Mihomo 这里写入 rule-providers；behavior 决定规则语义，format 决定文件格式，inline 规则可在 JSON 里补 payload。"}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <FilterField className="min-w-0" label="名称/标签">
          <Input disabled={disabled} onChange={(event) => patch({ name: event.target.value, tag: event.target.value })} placeholder="geosite-cn" value={stringValue(provider.name ?? source.tag)} />
        </FilterField>
        <FilterField className="min-w-0" label="类型">
          <NativeSelect disabled={disabled} onChange={(event) => patch({ type: event.target.value })} value={stringValue(source.type) || "http"}>
            {(format === "sing-box" ? singBoxRuleSetTypes : clashRuleProviderTypes).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField className="min-w-0" label="URL">
          <Input disabled={disabled} onChange={(event) => patch({ url: event.target.value })} placeholder="https://example.com/rules.yaml" value={stringValue(source.url)} />
        </FilterField>
        <FilterField className="min-w-0" label="本地路径">
          <Input disabled={disabled} onChange={(event) => patch({ path: event.target.value })} placeholder="./rules/geosite-cn.yaml" value={stringValue(source.path)} />
        </FilterField>
        <FilterField className="min-w-0" label="更新间隔秒">
          <Input
            disabled={disabled}
            min={0}
            onChange={(event) => patch(format === "sing-box" ? { update_interval: Number(event.target.value) } : { interval: Number(event.target.value) })}
            type="number"
            value={String(numberValue(format === "sing-box" ? source.update_interval : source.interval) ?? 86400)}
          />
        </FilterField>
        <FilterField className="min-w-0" label={format === "sing-box" ? "文件格式" : "行为"}>
          <NativeSelect
            disabled={disabled}
            onChange={(event) => patch(format === "sing-box" ? { format: event.target.value } : { behavior: event.target.value })}
            value={stringValue(format === "sing-box" ? source.format : source.behavior) || (format === "sing-box" ? "source" : "domain")}
          >
            {(format === "sing-box" ? singBoxRuleSetFormats : clashRuleBehaviors).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </NativeSelect>
        </FilterField>
        {format !== "sing-box" ? (
          <FilterField className="min-w-0" label="文件格式">
            <NativeSelect disabled={disabled} onChange={(event) => patch({ format: event.target.value })} value={stringValue(source.format) || "yaml"}>
              {clashRuleFormats.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </NativeSelect>
          </FilterField>
        ) : (
          <FilterField className="min-w-0" label="下载出站 / download_detour">
            <Input disabled={disabled} onChange={(event) => patch({ download_detour: event.target.value })} placeholder="direct" value={stringValue(source.download_detour)} />
          </FilterField>
        )}
      </div>
    </div>
  );
}

function ProxyProviderEditor({
  content,
  disabled,
  onChange
}: {
  content: string;
  disabled: boolean;
  onChange: (content: string) => void;
}) {
  const provider = parseJsonObject(content) ?? parseJsonObject(defaultContentFor("proxy-provider")) ?? {};

  function patch(next: Record<string, unknown>) {
    const name = stringValue(next.name ?? provider.name) || "remote-proxies";
    const currentEntry = objectRecord(provider[name]) ?? provider;
    const nextEntry = compactObject({ ...currentEntry, ...next });
    const contentValue = next.name && next.name !== provider.name ? { [String(next.name)]: nextEntry, name: next.name } : { ...provider, name, [name]: nextEntry };
    onChange(JSON.stringify(contentValue, null, 2));
  }

  const source = objectRecord(provider[stringValue(provider.name) || "remote-proxies"]) ?? provider;
  const healthCheck = objectRecord(source["health-check"]);

  return (
    <div className="grid gap-3 rounded-xl border bg-card/70 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-chart-5">
        <FileJson2 />
        代理集参数
      </div>
      <p className="rounded-lg border bg-background/70 px-2.5 py-2 text-xs leading-5 text-muted-foreground">
        这组配置主要对应 Clash / Mihomo 的 <span className="font-mono">proxy-providers</span>。<span className="font-medium text-foreground">name</span> 是 provider 键名，<span className="font-medium text-foreground">type</span> 决定来源方式，当前表单先暴露 <span className="font-mono">http</span> / <span className="font-mono">file</span>；<span className="font-medium text-foreground">url</span> 只在远程拉取时使用，<span className="font-medium text-foreground">path</span> 是本地缓存文件路径，<span className="font-medium text-foreground">interval</span> 是刷新秒数，<span className="font-medium text-foreground">health-check.url</span> 是可用性检测地址。
      </p>
      <p className="text-xs leading-5 text-muted-foreground">
        其他常见字段也能直接写进 JSON，比如 <span className="font-mono">proxy</span>、<span className="font-mono">size-limit</span>、<span className="font-mono">header</span>、<span className="font-mono">health-check.interval</span> / <span className="font-mono">timeout</span> / <span className="font-mono">lazy</span> / <span className="font-mono">expected-status</span>、<span className="font-mono">filter</span>、<span className="font-mono">exclude-filter</span>、<span className="font-mono">exclude-type</span>、<span className="font-mono">override</span>、<span className="font-mono">payload</span>。
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <FilterField className="min-w-0" label="名称">
          <Input disabled={disabled} onChange={(event) => patch({ name: event.target.value })} placeholder="remote-proxies" value={stringValue(provider.name)} />
        </FilterField>
        <FilterField className="min-w-0" label="类型">
          <NativeSelect disabled={disabled} onChange={(event) => patch({ type: event.target.value })} value={stringValue(source.type) || "http"}>
            <option value="http">http</option>
            <option value="file">file</option>
          </NativeSelect>
        </FilterField>
        <FilterField className="min-w-0" label="URL">
          <Input disabled={disabled} onChange={(event) => patch({ url: event.target.value })} placeholder="https://example.com/proxies.yaml" value={stringValue(source.url)} />
        </FilterField>
        <FilterField className="min-w-0" label="本地路径">
          <Input disabled={disabled} onChange={(event) => patch({ path: event.target.value })} placeholder="./providers/remote.yaml" value={stringValue(source.path)} />
        </FilterField>
        <FilterField className="min-w-0" label="更新间隔秒">
          <Input disabled={disabled} min={0} onChange={(event) => patch({ interval: Number(event.target.value) })} type="number" value={String(numberValue(source.interval) ?? 3600)} />
        </FilterField>
        <FilterField className="min-w-0" label="健康检查 URL">
          <Input
            disabled={disabled}
            onChange={(event) => patch({ "health-check": compactObject({ ...healthCheck, enable: true, url: event.target.value }) })}
            placeholder="http://www.gstatic.com/generate_204"
            value={stringValue(healthCheck.url ?? source.healthCheckUrl)}
          />
        </FilterField>
      </div>
    </div>
  );
}

function ObservatoryEditor({ content, disabled, onChange }: { content: string; disabled: boolean; onChange: (content: string) => void }) {
  const observatoryContent = parseJsonObject(content) ?? parseJsonObject(defaultContentFor("observatory")) ?? {};
  const observatory = objectRecord(observatoryContent.observatory);

  function patch(next: Record<string, unknown>) {
    onChange(JSON.stringify({
      ...observatoryContent,
      observatory: compactObject({
        ...observatory,
        probeInterval: next.probeInterval ?? observatory.probeInterval,
        probeURL: next.probeUrl ?? observatory.probeURL,
        subjectSelector: next.subjectSelector ?? observatory.subjectSelector
      })
    }, null, 2));
  }

  return (
    <div className="grid gap-3 rounded-xl border bg-card/70 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-chart-5">
        <Globe2 />
        观测参数
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <FilterField className="min-w-0" label="探测 URL">
          <Input disabled={disabled} onChange={(event) => patch({ probeUrl: event.target.value })} placeholder="https://www.google.com/generate_204" value={stringValue(observatory.probeURL ?? observatoryContent.probeUrl)} />
        </FilterField>
        <FilterField className="min-w-0" label="探测间隔">
          <Input disabled={disabled} onChange={(event) => patch({ probeInterval: event.target.value })} placeholder="10m" value={stringValue(observatory.probeInterval ?? observatoryContent.probeInterval)} />
        </FilterField>
      </div>
      <FilterField className="min-w-0" label="节点选择器（每行一个）">
        <Textarea
          className="min-h-16 font-mono text-xs"
          disabled={disabled}
          onChange={(event) => patch({ subjectSelector: fromLines(event.target.value) })}
          value={toLines(observatory.subjectSelector ?? observatoryContent.subjectSelector)}
        />
      </FilterField>
    </div>
  );
}

function defaultContentFor(type: ProfileModuleType) {
  return defaultContentForFormat(type, "clash");
}

function defaultContentForFormat(type: ProfileModuleType, format: ProfileModuleFormat) {
  if (type === "dns") {
    return JSON.stringify(defaultDnsContent, null, 2);
  }

  if (type === "inbound") {
    return JSON.stringify(defaultInboundContent, null, 2);
  }

  if (type === "tun") {
    return JSON.stringify(defaultTunContent, null, 2);
  }

  if (type === "rule-provider") {
    if (format === "sing-box") {
      return JSON.stringify({
        rule_set: [
          {
            type: "remote",
            tag: "geosite-cn",
            format: "source",
            url: "",
            download_detour: "direct",
            update_interval: 86400
          }
        ]
      }, null, 2);
    }

    if (format === "xray") {
      return JSON.stringify({
        routing: {
          domainStrategy: "AsIs",
          rules: [],
          balancers: []
        }
      }, null, 2);
    }

    return JSON.stringify({ name: "remote-rules", type: "http", url: "", interval: 86400, behavior: "domain", format: "yaml" }, null, 2);
  }

  if (type === "proxy-provider") {
    return JSON.stringify({
      name: "remote-proxies",
      "remote-proxies": {
        type: "http",
        url: "",
        interval: 3600,
        path: "./providers/remote-proxies.yaml",
        "health-check": {
          enable: true,
          url: "http://www.gstatic.com/generate_204",
          interval: 300,
          timeout: 5000,
          lazy: true
        }
      }
    }, null, 2);
  }

  if (type === "observatory") {
    return JSON.stringify({ probeUrl: "https://www.google.com/generate_204", subjectSelector: ["node:"], probeInterval: "10m" }, null, 2);
  }

  return "{}";
}

function dnsStrategyOptionsFor(format: ProfileModuleFormat) {
  if (format === "xray") {
    return xrayDnsStrategyOptions;
  }

  if (format === "common") {
    return [{ label: "默认/不设置（专用模块里设置策略）", value: "" }];
  }

  if (format === "clash") {
    return [{ label: "默认/不设置", value: "" }];
  }

  return singBoxDnsStrategyOptions;
}

function moduleTypeLabel(type: ProfileModuleType) {
  if (type === "dns") {
    return "DNS";
  }

  if (type === "inbound") {
    return "入站";
  }

  if (type === "tun") {
    return "TUN";
  }

  if (type === "rule-provider") {
    return "规则集";
  }

  if (type === "proxy-provider") {
    return "代理集";
  }

  if (type === "observatory") {
    return "观测";
  }

  return "高级覆盖";
}

function modulesForTab(modules: ProfileModuleDto[], tab: ModuleTabKey) {
  if (tab === "default") {
    return modules.filter((module) => module.is_default);
  }

  return modules.filter((module) => !module.is_default && module.format === tab);
}

function filterProfileModules(modules: ProfileModuleDto[], query: string) {
  const keyword = query.trim().toLowerCase();

  if (!keyword) {
    return modules;
  }

  return modules.filter((module) => {
    // 模块内容是用户自由 JSON，搜索时序列化纳入匹配，方便定位远程 URL、标签和特殊字段。
    const searchableText = [
      module.name,
      module.format,
      module.type,
      module.profile_name ?? "",
      module.is_default ? "默认 default" : "",
      module.enabled ? "启用 enabled" : "停用 disabled",
      moduleTypeLabel(module.type),
      JSON.stringify(module.content)
    ].join(" ").toLowerCase();

    return searchableText.includes(keyword);
  });
}

function summaryItemsForModule(module: ProfileModuleDto) {
  const content = module.content;

  if (module.type === "dns") {
    return [
      { label: "服务器", value: `${toArray(content.servers).length} 个` },
      { label: "策略", value: stringValue(content.strategy) || stringValue(content.enhancedMode) || "默认" },
      { label: "备用", value: `${toArray(content.fallback).length} 个` }
    ];
  }

  if (module.type === "inbound") {
    return [
      { label: "类型", value: stringValue(content.inboundType) || "mixed" },
      { label: "监听", value: `${stringValue(content.listen) || "127.0.0.1"}:${String(numberValue(content.port) ?? 2080)}` },
      { label: "标签", value: stringValue(content.tag) || "mixed-in" }
    ];
  }

  if (module.type === "tun") {
    return [
      { label: "协议栈", value: stringValue(content.stack) || "mixed" },
      { label: "地址", value: firstArrayValue(content.address) || "未设置" },
      { label: "MTU", value: String(numberValue(content.mtu) ?? "默认") }
    ];
  }

  if (module.type === "rule-provider") {
    const source = providerSource(content, "remote-rules");

    return [
      { label: "名称", value: stringValue(content.name ?? source.tag) || "规则集" },
      { label: "类型", value: stringValue(source.type) || "remote" },
      { label: "地址", value: stringValue(source.url ?? source.path) || `${toArray(content.rule_set).length} 个 rule_set` }
    ];
  }

  if (module.type === "proxy-provider") {
    const source = providerSource(content, "remote-proxies");

    return [
      { label: "名称", value: stringValue(content.name) || "代理集" },
      { label: "类型", value: stringValue(source.type) || "http" },
      { label: "地址", value: stringValue(source.url ?? source.path) || "未设置" }
    ];
  }

  if (module.type === "observatory") {
    const observatory = objectRecord(content.observatory);

    return [
      { label: "探测", value: stringValue(observatory.probeURL ?? content.probeUrl) || "未设置" },
      { label: "间隔", value: stringValue(observatory.probeInterval ?? content.probeInterval) || "默认" },
      { label: "选择器", value: firstArrayValue(observatory.subjectSelector ?? content.subjectSelector) || "未设置" }
    ];
  }

  return [
    { label: "顶层键", value: `${Object.keys(content).length} 个` },
    { label: "格式", value: module.format },
    { label: "类型", value: moduleTypeLabel(module.type) }
  ];
}

function providerSource(content: Record<string, unknown>, fallbackName: string) {
  const name = stringValue(content.name) || fallbackName;
  return objectRecord(content[name]) || content;
}

function firstArrayValue(value: unknown) {
  return toArray(value)[0] ?? "";
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function copyText(value: string) {
  if (!value || typeof navigator === "undefined" || !navigator.clipboard) {
    return;
  }

  void navigator.clipboard.writeText(value);
}

function ToggleBox({ checked, disabled, label, onChange }: { checked: boolean; disabled: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="inline-flex min-h-8 items-center gap-2 rounded-lg border bg-background/70 px-2.5">
      <Checkbox checked={checked} disabled={disabled} onCheckedChange={(value) => onChange(value === true)} />
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    </label>
  );
}

function DnsEditor({
  content,
  disabled,
  format,
  onChange
}: {
  content: string;
  disabled: boolean;
  format: ProfileModuleFormat;
  onChange: (content: string) => void;
}) {
  const dns = (parseJsonObject(content) ?? defaultDnsContent) as Record<string, unknown>;
  const servers = toDnsServerLines(dns.servers ?? dns.nameserver);
  const fallback = toLines(dns.fallback);
  const fakeIpFilter = toLines(dns.fakeIpFilter);
  const strategyOptions = dnsStrategyOptionsFor(format);
  const currentStrategy = stringValue(format === "xray" ? dns.queryStrategy ?? dns.strategy : dns.strategy);
  const hasCustomStrategy = Boolean(currentStrategy && !strategyOptions.some((option) => option.value === currentStrategy));
  const serverLabel = format === "xray"
    ? "Xray servers（字符串或 JSON 对象，每行一个）"
    : format === "sing-box"
      ? "sing-box servers（字符串或 JSON 对象，每行一个）"
      : "DNS 服务器 / nameserver（每行一个）";
  const showFallback = format === "clash" || format === "common";
  const showFakeIpFilter = format === "clash" || format === "common";
  const showFakeIpToggle = format === "sing-box" || format === "common";

  function patch(next: Record<string, unknown>) {
    onChange(JSON.stringify({ ...dns, ...next }, null, 2));
  }

  function changeStrategy(strategy: string) {
    if (format === "xray") {
      patch({ queryStrategy: strategy, strategy: undefined });
      return;
    }

    patch({ strategy });
  }

  return (
    <div className="grid gap-3 rounded-xl border bg-card/70 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-chart-5">
        <Globe2 />
        DNS 参数
      </div>
      <p className="rounded-lg border bg-background/70 px-2.5 py-2 text-xs leading-5 text-muted-foreground">
        {moduleDnsHints[format]}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <FilterField className="min-w-0" label="解析策略">
          <NativeSelect disabled={disabled} onChange={(event) => changeStrategy(event.target.value)} value={currentStrategy}>
            {strategyOptions.map((option) => (
              <option key={option.value || "default"} value={option.value}>{option.label}</option>
            ))}
            {hasCustomStrategy ? <option value={currentStrategy}>自定义：{currentStrategy}</option> : null}
          </NativeSelect>
        </FilterField>
        {format === "sing-box" ? (
          <FilterField className="min-w-0" label="默认 DNS tag / final">
            <Input disabled={disabled} onChange={(event) => patch({ final: event.target.value })} placeholder="dns-1" value={stringValue(dns.final)} />
          </FilterField>
        ) : null}
        {format === "xray" ? (
          <FilterField className="min-w-0" label="客户端 IP / clientIp">
            <Input disabled={disabled} onChange={(event) => patch({ clientIp: event.target.value })} placeholder="1.2.3.4" value={stringValue(dns.clientIp ?? dns.clientIP)} />
          </FilterField>
        ) : null}
        {format === "clash" || format === "common" ? (
          <FilterField className="min-w-0" label="Clash 增强模式">
            <NativeSelect disabled={disabled} onChange={(event) => patch({ enhancedMode: event.target.value })} value={stringValue(dns.enhancedMode ?? dns["enhanced-mode"]) || "fake-ip"}>
              <option value="fake-ip">fake-ip</option>
              <option value="redir-host">redir-host</option>
            </NativeSelect>
          </FilterField>
        ) : null}
      </div>
      <FilterField className="min-w-0" label={serverLabel}>
        <Textarea
          className="min-h-24 font-mono text-xs"
          disabled={disabled}
          onChange={(event) => patch({ servers: fromDnsServerLines(event.target.value) })}
          value={servers}
        />
      </FilterField>
      {showFallback ? (
        <FilterField className="min-w-0" label="备用 DNS / fallback（每行一个）">
          <Textarea
            className="min-h-16 font-mono text-xs"
            disabled={disabled}
            onChange={(event) => patch({ fallback: fromLines(event.target.value) })}
            value={fallback}
          />
        </FilterField>
      ) : null}
      {showFakeIpFilter ? (
        <FilterField className="min-w-0" label="fake-ip 过滤（每行一个）">
          <Textarea
            className="min-h-16 font-mono text-xs"
            disabled={disabled}
            onChange={(event) => patch({ fakeIpFilter: fromLines(event.target.value) })}
            value={fakeIpFilter}
          />
        </FilterField>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {format === "clash" || format === "common" ? (
          <ToggleBox checked={Boolean(dns.enable ?? true)} disabled={disabled} label="Clash DNS 启用" onChange={(enable) => patch({ enable })} />
        ) : null}
        {showFakeIpToggle ? (
          <ToggleBox checked={Boolean(dns.fakeIp)} disabled={disabled} label="sing-box fakeip" onChange={(fakeIp) => patch({ fakeIp })} />
        ) : null}
        {format === "xray" ? (
          <>
            <ToggleBox checked={Boolean(dns.disableFallback)} disabled={disabled} label="禁用 fallback" onChange={(disableFallback) => patch({ disableFallback })} />
            <ToggleBox checked={Boolean(dns.disableCache)} disabled={disabled} label="禁用缓存" onChange={(disableCache) => patch({ disableCache })} />
          </>
        ) : null}
      </div>
    </div>
  );
}

function parseJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;

    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function fromLines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function fromDnsServerLines(value: string) {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).map((item) => {
    if (!item.startsWith("{")) {
      return item;
    }

    try {
      const parsed = JSON.parse(item) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : item;
    } catch {
      return item;
    }
  });
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function compactObject(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== "")) as Record<string, unknown>;
}

function objectRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function toLines(value: unknown) {
  return Array.isArray(value) ? value.map(String).join("\n") : "";
}

function toDnsServerLines(value: unknown) {
  if (!Array.isArray(value)) {
    return typeof value === "string" ? value : "";
  }

  return value.map((item) => {
    if (item && typeof item === "object") {
      return JSON.stringify(item);
    }

    return String(item);
  }).join("\n");
}

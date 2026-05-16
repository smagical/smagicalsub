import { useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { ProfileDto } from "@smagicalsub/shared";
import { DownloadCloud, GitMerge, Import, ListChecks, Plus, WandSparkles } from "lucide-react";
import { FilterField } from "../../shared/FilterField";
import { fetchRemoteProfileConfig } from "./api";
import { ConfigParameterTable } from "./ProfileParameterTable";
import type { ImportConfigFormat, ProfileBuildPreview } from "./profileImport";
import { buildImportPreview, canCreatePreview } from "./profileImport";

type ProfileToolsProps = {
  mergePreview: ProfileBuildPreview | null;
  pending: boolean;
  profiles: ProfileDto[];
  onCreateFromPreview: (preview: ProfileBuildPreview) => void;
  onPreviewMerge: (input: { defaultStrategy: string; description: string; name: string; profileIds: string[] }) => void;
};

export function ProfileTools({ mergePreview, pending, profiles, onCreateFromPreview, onPreviewMerge }: ProfileToolsProps) {
  const [importOpen, setImportOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);

  return (
    <section className="grid gap-3 rounded-xl border bg-card p-3 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.2fr)]">
      <div className="grid gap-2">
        <Badge className="w-fit gap-1.5 border-chart-3/30 bg-chart-3/10 text-chart-3" variant="outline">
          <WandSparkles />
          配置档工具
        </Badge>
        <div className="grid gap-1">
          <h3 className="text-base font-semibold leading-tight">导入和合并前先预览</h3>
          <p className="text-xs leading-5 text-muted-foreground">
            导入配置会解析规则生成新配置档；合并会读取多个配置档规则并去重，确认前不会写入数据。
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <ToolButton
          description="粘贴 Clash/Mihomo、sing-box 或 Xray 配置，先预览再创建。"
          icon={Import}
          label="导入配置"
          onClick={() => setImportOpen(true)}
        />
        <ToolButton
          description="选择多个配置档，按选择顺序合并规则并生成新配置档。"
          icon={GitMerge}
          label="合并配置档"
          onClick={() => setMergeOpen(true)}
        />
      </div>

      <ImportProfileDialog
        open={importOpen}
        pending={pending}
        onCreateFromPreview={onCreateFromPreview}
        onOpenChange={setImportOpen}
      />
      <MergeProfilesDialog
        mergePreview={mergePreview}
        open={mergeOpen}
        pending={pending}
        profiles={profiles}
        onCreateFromPreview={onCreateFromPreview}
        onOpenChange={setMergeOpen}
        onPreviewMerge={onPreviewMerge}
      />
    </section>
  );
}

function ImportProfileDialog({
  open,
  pending,
  onCreateFromPreview,
  onOpenChange
}: {
  open: boolean;
  pending: boolean;
  onCreateFromPreview: (preview: ProfileBuildPreview) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [content, setContent] = useState("");
  const [defaultStrategy, setDefaultStrategy] = useState("Proxy");
  const [description, setDescription] = useState("从配置文件导入生成");
  const [format, setFormat] = useState<ImportConfigFormat>("auto");
  const [name, setName] = useState("导入配置档");
  const [preview, setPreview] = useState<ProfileBuildPreview | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [remotePending, setRemotePending] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState("");

  function refreshPreview() {
    setPreview(buildImportPreview({ content, defaultStrategy, description, format, name }));
  }

  async function pullRemoteConfig() {
    const normalizedUrl = remoteUrl.trim();

    if (!normalizedUrl) {
      setRemoteError("请先填写远程配置地址。");
      return;
    }

    setRemoteError(null);
    setRemotePending(true);

    try {
      const result = await fetchRemoteProfileConfig({ url: normalizedUrl });
      setContent(result.content);
      setPreview(null);

      const nextName = profileNameFromUrl(result.url);
      if (nextName && name === "导入配置档") {
        setName(nextName);
      }
      setFormat((current) => current === "auto" ? formatFromUrl(result.url) : current);
    } catch (error) {
      setRemoteError(error instanceof Error ? error.message : "远程配置拉取失败。");
    } finally {
      setRemotePending(false);
    }
  }

  function createProfile() {
    if (!preview) {
      return;
    }

    onCreateFromPreview(preview);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid w-[min(96vw,1120px)] max-h-[92dvh] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle>导入配置生成配置档</DialogTitle>
          <DialogDescription>粘贴配置后先生成预览，确认规则数量、重复项和无法转换项，再创建新配置档。</DialogDescription>
        </DialogHeader>
        <DialogBody className="min-h-0 max-h-none gap-3 overflow-auto">
          <div className="grid gap-3 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
            <div className="grid gap-3">
              <div className="grid gap-2 rounded-xl border bg-card/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">远程导入</span>
                  <Badge className="border-primary/30 bg-primary/10 text-primary" variant="outline">Worker 代拉取</Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Input
                    disabled={pending || remotePending}
                    onChange={(event) => {
                      setRemoteUrl(event.target.value);
                      setRemoteError(null);
                    }}
                    placeholder="https://example.com/config.yaml 或 xray.json"
                    type="url"
                    value={remoteUrl}
                  />
                  <Button disabled={pending || remotePending || !remoteUrl.trim()} onClick={pullRemoteConfig} type="button" variant="info">
                    <DownloadCloud data-icon="inline-start" />
                    {remotePending ? "拉取中" : "拉取远程"}
                  </Button>
                </div>
                {remoteError ? <p className="text-xs text-destructive">{remoteError}</p> : null}
                <p className="text-xs text-muted-foreground">远程内容会写入下方配置内容框，仍需生成预览后再创建。</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FilterField label="配置档名称">
                  <Input disabled={pending || remotePending} onChange={(event) => setName(event.target.value)} value={name} />
                </FilterField>
                <FilterField label="默认策略">
                  <Input disabled={pending || remotePending} onChange={(event) => setDefaultStrategy(event.target.value)} value={defaultStrategy} />
                </FilterField>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                <FilterField label="描述">
                  <Input disabled={pending || remotePending} onChange={(event) => setDescription(event.target.value)} value={description} />
                </FilterField>
                <FilterField label="配置格式">
                  <NativeSelect disabled={pending || remotePending} onChange={(event) => setFormat(event.target.value as ImportConfigFormat)} value={format}>
                    <option value="auto">自动识别</option>
                    <option value="clash">Clash/Mihomo</option>
                    <option value="sing-box">sing-box</option>
                    <option value="xray">Xray</option>
                  </NativeSelect>
                </FilterField>
              </div>
              <FilterField label="配置内容">
                <Textarea
                  className="min-h-[320px] font-mono text-xs"
                  disabled={pending || remotePending}
                  onChange={(event) => {
                    setContent(event.target.value);
                    setPreview(null);
                  }}
                  placeholder="粘贴 Clash/Mihomo YAML、sing-box JSON 或 Xray JSON"
                  value={content}
                />
              </FilterField>
            </div>
            <PreviewPanel preview={preview} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button disabled={pending || remotePending} onClick={() => onOpenChange(false)} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending || remotePending || !content.trim()} onClick={refreshPreview} type="button" variant="secondary">
            <ListChecks data-icon="inline-start" />
            生成预览
          </Button>
          <Button disabled={pending || remotePending || !canCreatePreview(preview)} onClick={createProfile} type="button" variant="info">
            <Plus data-icon="inline-start" />
            创建配置档
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MergeProfilesDialog({
  mergePreview,
  open,
  pending,
  profiles,
  onCreateFromPreview,
  onOpenChange,
  onPreviewMerge
}: {
  mergePreview: ProfileBuildPreview | null;
  open: boolean;
  pending: boolean;
  profiles: ProfileDto[];
  onCreateFromPreview: (preview: ProfileBuildPreview) => void;
  onOpenChange: (open: boolean) => void;
  onPreviewMerge: (input: { defaultStrategy: string; description: string; name: string; profileIds: string[] }) => void;
}) {
  const [defaultStrategy, setDefaultStrategy] = useState("Proxy");
  const [description, setDescription] = useState("合并多个配置档生成");
  const [name, setName] = useState("合并配置档");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectedProfiles = useMemo(
    () => selectedIds.map((id) => profiles.find((profile) => profile.id === id)).filter((profile): profile is ProfileDto => Boolean(profile)),
    [profiles, selectedIds]
  );

  function toggleProfile(profileId: string, checked: boolean) {
    setSelectedIds((current) => checked ? [...current, profileId] : current.filter((id) => id !== profileId));
  }

  function previewMerge() {
    onPreviewMerge({ defaultStrategy, description, name, profileIds: selectedIds });
  }

  function createProfile() {
    if (!mergePreview) {
      return;
    }

    onCreateFromPreview(mergePreview);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid w-[min(96vw,1120px)] max-h-[92dvh] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden p-4">
        <DialogHeader>
          <DialogTitle>合并配置档</DialogTitle>
          <DialogDescription>选择两个或多个配置档，先预览规则合并结果和重复项，再创建新配置档。</DialogDescription>
        </DialogHeader>
        <DialogBody className="min-h-0 max-h-none gap-3 overflow-auto">
          <div className="grid gap-3 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <FilterField label="新配置档名称">
                  <Input disabled={pending} onChange={(event) => setName(event.target.value)} value={name} />
                </FilterField>
                <FilterField label="默认策略">
                  <Input disabled={pending} onChange={(event) => setDefaultStrategy(event.target.value)} value={defaultStrategy} />
                </FilterField>
              </div>
              <FilterField label="描述">
                <Input disabled={pending} onChange={(event) => setDescription(event.target.value)} value={description} />
              </FilterField>

              <div className="grid gap-2 rounded-xl border bg-card/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">选择配置档</span>
                  <Badge variant="outline">已选 {selectedProfiles.length}</Badge>
                </div>
                <div className="grid max-h-[330px] gap-2 overflow-auto pr-1">
                  {profiles.map((profile) => {
                    const checked = selectedIds.includes(profile.id);

                    return (
                      <label className="flex items-center gap-3 rounded-lg border bg-background/65 p-2" key={profile.id}>
                        <Checkbox checked={checked} disabled={pending} onCheckedChange={(value) => toggleProfile(profile.id, value === true)} />
                        <span className="grid min-w-0 flex-1 gap-0.5">
                          <span className="truncate text-sm font-medium">{profile.name}</span>
                          <span className="truncate text-xs text-muted-foreground">{profile.description ?? "未填写描述"}</span>
                        </span>
                        <Badge className="font-mono" variant="outline">{profile.default_strategy}</Badge>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <PreviewPanel preview={mergePreview} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button disabled={pending} onClick={() => onOpenChange(false)} type="button" variant="outline">
            取消
          </Button>
          <Button disabled={pending || selectedIds.length < 2} onClick={previewMerge} type="button" variant="secondary">
            <ListChecks data-icon="inline-start" />
            生成预览
          </Button>
          <Button disabled={pending || !canCreatePreview(mergePreview)} onClick={createProfile} type="button" variant="info">
            <Plus data-icon="inline-start" />
            创建配置档
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewPanel({ preview }: { preview: ProfileBuildPreview | null }) {
  if (!preview) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-xl border bg-card/65 p-4 text-center">
        <div className="grid gap-2">
          <Badge className="mx-auto w-fit" variant="outline">等待预览</Badge>
          <p className="text-sm text-muted-foreground">生成预览后会展示可创建规则、重复项和无法转换项。</p>
        </div>
      </div>
    );
  }

  const firstModule = preview.modules[0];

  return (
    <div className="grid gap-3 rounded-xl border bg-card/65 p-3">
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="grid gap-0.5">
            <h4 className="text-sm font-semibold">{preview.name}</h4>
            <p className="text-xs text-muted-foreground">{preview.description}</p>
          </div>
          <Badge variant="secondary">{preview.sourceLabel}</Badge>
        </div>
        <div className="grid gap-2 sm:grid-cols-4">
          <PreviewMetric label="可创建" value={preview.rules.length} />
          <PreviewMetric label="模块" value={preview.modules.length} />
          <PreviewMetric label="重复跳过" value={preview.duplicateRules.length} />
          <PreviewMetric label="问题" value={preview.issues.length} />
        </div>
      </div>

      {preview.modules.length > 0 ? (
        <div className="grid gap-2">
          <span className="text-xs font-semibold text-muted-foreground">模块预览</span>
          <div className="grid max-h-[160px] gap-1 overflow-auto rounded-lg border bg-background/70 p-2 text-xs">
            {preview.modules.map((module) => (
              <div className="flex min-w-0 items-center gap-2 rounded-md bg-muted/35 px-2 py-1" key={`${module.format}-${module.type}-${module.name}`}>
                <Badge variant="outline">{module.format}</Badge>
                <Badge variant="secondary">{moduleTypeLabel(module.type)}</Badge>
                <span className="min-w-0 flex-1 truncate font-medium">{module.name}</span>
              </div>
            ))}
          </div>
          {firstModule ? (
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground">首个模块参数</span>
                <Badge className="max-w-full truncate" variant="outline">{firstModule.name}</Badge>
              </div>
              <ConfigParameterTable compact content={firstModule.content} format={firstModule.format} maxRows={10} type={firstModule.type} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-2">
        <span className="text-xs font-semibold text-muted-foreground">规则预览</span>
        <div className="grid max-h-[240px] gap-1 overflow-auto rounded-lg border bg-background/70 p-2 font-mono text-xs">
          {preview.rules.slice(0, 120).map((rule) => (
            <div className="flex min-w-0 items-center gap-2 rounded-md bg-muted/25 px-2 py-1" key={`${rule.position}-${rule.format}-${rule.rule}`} title={rule.rule}>
              <span className="shrink-0 text-muted-foreground">{rule.position}.</span>
              <Badge className="shrink-0 font-sans" variant={rule.format === "common" ? "secondary" : "outline"}>
                {rule.format}
              </Badge>
              <span className="min-w-0 flex-1 truncate">{rule.rule}</span>
            </div>
          ))}
          {preview.rules.length > 120 ? <div className="text-muted-foreground">还有 {preview.rules.length - 120} 条未展示...</div> : null}
          {preview.rules.length === 0 ? <div className="text-muted-foreground">没有可创建规则</div> : null}
        </div>
      </div>

      {preview.issues.length > 0 || preview.duplicateRules.length > 0 ? (
        <div className="grid gap-2">
          <span className="text-xs font-semibold text-muted-foreground">预览提示</span>
          <div className="grid max-h-[160px] gap-1 overflow-auto rounded-lg border bg-background/70 p-2 text-xs">
            {preview.duplicateRules.slice(0, 40).map((rule) => (
              <div className="truncate text-muted-foreground" key={`dup-${rule.position}-${rule.rule}`} title={rule.rule}>
                重复跳过：{rule.rule}
              </div>
            ))}
            {preview.issues.map((issue, index) => (
              <div className="truncate text-destructive" key={`${issue.message}-${index}`} title={issue.source}>
                {issue.message}{issue.source ? `：${issue.source}` : ""}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PreviewMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-background/70 px-2.5 py-2">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="truncate font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}

function moduleTypeLabel(type: string) {
  switch (type) {
    case "dns":
      return "DNS";
    case "inbound":
      return "入站";
    case "tun":
      return "TUN";
    case "rule-provider":
      return "规则集";
    case "proxy-provider":
      return "代理集";
    case "observatory":
      return "观测";
    default:
      return "高级覆盖";
  }
}

function ToolButton({
  description,
  icon: Icon,
  label,
  onClick
}: {
  description: string;
  icon: typeof Import;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="grid gap-2 rounded-xl border bg-background/70 p-3 text-left transition-colors hover:bg-muted/45" onClick={onClick} type="button">
      <span className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="text-chart-3" />
        {label}
      </span>
      <span className="text-xs leading-5 text-muted-foreground">{description}</span>
    </button>
  );
}

function profileNameFromUrl(value: string) {
  try {
    const url = new URL(value);
    const segment = url.pathname.split("/").filter(Boolean).at(-1);
    return decodeURIComponent(segment || url.hostname).replace(/\.(json|ya?ml|conf|txt)$/i, "").slice(0, 80);
  } catch {
    return "";
  }
}

function formatFromUrl(value: string): ImportConfigFormat {
  try {
    const pathname = new URL(value).pathname.toLowerCase();

    if (pathname.includes("sing-box") || pathname.includes("singbox")) {
      return "sing-box";
    }

    if (pathname.includes("xray")) {
      return "xray";
    }

    if (pathname.endsWith(".yaml") || pathname.endsWith(".yml")) {
      return "clash";
    }
  } catch {
    return "auto";
  }

  return "auto";
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NodeDto, ProfileDto, SubscribeTokenDto } from "@smagicalsub/shared";
import { ArrowRight, Clock3, KeyRound, Layers3, Link2, Route, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { EmptyState } from "../../shared/EmptyState";
import { ModulePanel } from "../../shared/ModulePanel";
import { PageFeedback } from "../../shared/PageFeedback";
import { SubscriptionOutputCenter } from "./SubscriptionOutputCenter";
import { TokenFilters } from "./TokenFilters";
import { TokenForm } from "./TokenForm";
import { TokensTable } from "./TokensTable";
import { exportTokensCsv } from "./utils";
import { useTokensPage } from "./useTokensPage";

export function TokensPage() {
  const page = useTokensPage();

  return (
    <ModulePanel
      eyebrow="Tokens"
      title="订阅令牌"
      description="面向 Clash、v2rayN、Base64 明文和 sing-box 的订阅分发工作台。"
      tone="cyan"
    >
      <TokenHero tokens={page.tokens} nodes={page.nodes} profiles={page.profiles} />

      <div className="grid gap-4 2xl:grid-cols-[minmax(360px,0.96fr)_minmax(520px,1.04fr)]">
        <TokenForm
          form={page.form}
          nodes={page.nodes}
          pending={page.pending}
          profiles={page.profiles}
          setForm={page.setForm}
          onSubmit={page.createToken}
        />
        {page.outputToken ? (
          <SubscriptionOutputCenter
            copyFormat={page.copyFormat}
            previewContent={page.previewContent}
            previewError={page.previewError}
            previewPending={page.previewPending}
            previewSource={page.previewSource}
            healthCheckPending={page.healthCheckPending}
            healthCheckResult={page.healthCheckResult}
            token={page.outputToken}
            diagnostics={page.outputDiagnostics}
            tokens={page.filteredTokens}
            onClearPreview={page.clearPreviewContent}
            onCopyAllFormats={(token) => void page.copyAllFormats(token)}
            onCopy={(token) => void page.handleCopy(token)}
            onCopyPreview={() => void page.copyPreviewContent()}
            onDownloadPreview={page.downloadPreviewContent}
            onFormatChange={page.setCopyFormat}
            onHealthCheck={(token) => void page.checkSubscriptionHealth(token)}
            onOpen={page.openSubscription}
            onPreview={(token) => void page.previewSubscription(token)}
            onTokenChange={page.setOutputTokenId}
          />
        ) : (
          <TokenOutputEmptyPanel />
        )}
      </div>

      <TokenFilters
        copyFormat={page.copyFormat}
        exportDisabled={page.filteredTokens.length === 0}
        searchQuery={page.searchQuery}
        onCopyFormatChange={page.setCopyFormat}
        onExport={() => exportTokensCsv(page.filteredTokens)}
        onSearchQueryChange={page.setSearchQuery}
      />

      <PageFeedback error={page.error} notice={page.notice} />

      {page.filteredTokens.length === 0 ? (
        <EmptyState label={page.emptyLabel} />
      ) : (
        <TokensTable
          copyFormat={page.copyFormat}
          editForm={page.editForm}
          editingTokenId={page.editingTokenId}
          pending={page.pending}
          profiles={page.profiles}
          nodes={page.nodes}
          tokens={page.filteredTokens}
          onCancelEdit={page.resetEdit}
          onCopy={(token) => void page.handleCopy(token)}
          onDelete={page.deleteToken}
          onEditFormChange={page.setEditForm}
          onOpen={page.openSubscription}
          onProfileChange={page.updateProfileBinding}
          onReset={page.resetToken}
          onSaveEdit={page.saveEdit}
          onStartEdit={page.startEdit}
          onToggleEnabled={page.toggleEnabled}
        />
      )}
    </ModulePanel>
  );
}

function TokenHero({ nodes, profiles, tokens }: { nodes: NodeDto[]; profiles: ProfileDto[]; tokens: SubscribeTokenDto[] }) {
  const enabledTokens = tokens.filter((token) => Boolean(token.enabled)).length;
  const partialTokens = tokens.filter((token) => token.node_ids.length > 0).length;
  const customPathTokens = tokens.filter((token) => token.custom_path?.trim()).length;
  const enabledNodes = nodes.filter((node) => Boolean(node.enabled)).length;
  const enabledProfiles = profiles.filter((profile) => Boolean(profile.enabled)).length;

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(280px,0.72fr)_minmax(0,1.28fr)]">
        <div className="flex min-h-56 flex-col justify-between gap-4 rounded-lg border bg-background/70 p-4">
          <div className="grid gap-2">
            <Badge className="w-fit gap-1.5 border-chart-2/30 bg-chart-2/10 text-chart-2" variant="outline">
              <Sparkles />
              多格式订阅
            </Badge>
            <div className="grid gap-1">
              <h2 className="text-2xl font-semibold leading-tight">订阅分发工作台</h2>
              <p className="text-sm text-muted-foreground">
                创建令牌后可以绑定配置档、限制节点范围，并把自定义路径映射到专属订阅地址。
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-chart-2/25 bg-chart-2/10 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Zap className="text-chart-2" />
              输出能力
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Clash</Badge>
              <Badge variant="secondary">v2rayN</Badge>
              <Badge variant="secondary">Base64 明文</Badge>
              <Badge variant="secondary">sing-box</Badge>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <MiniStat label="启用节点" value={`${enabledNodes}/${nodes.length}`} />
            <MiniStat label="启用配置档" value={`${enabledProfiles}/${profiles.length}`} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          <SummaryCard icon={KeyRound} label="令牌总数" value={tokens.length} hint={`${enabledTokens} 个启用`} tone="primary" />
          <SummaryCard icon={Layers3} label="部分节点" value={partialTokens} hint="可按协议和节点定制" tone="cyan" />
          <SummaryCard icon={Link2} label="自定义路径" value={customPathTokens} hint="支持固定入口映射" tone="accent" />
          <SummaryCard icon={Clock3} label="最近使用" value={recentUsageCount(tokens)} hint="有访问记录的令牌" tone="muted" />
        </div>
      </div>
    </section>
  );
}

function TokenOutputEmptyPanel() {
  return (
    <section className="flex min-h-[360px] flex-col justify-between gap-4 rounded-xl border bg-card p-4">
      <div className="grid gap-3">
        <Badge className="w-fit gap-1.5 border-chart-2/30 bg-chart-2/10 text-chart-2" variant="outline">
          <Route />
          输出中心
        </Badge>
        <div className="grid gap-2">
          <h3 className="text-xl font-semibold">创建令牌后生成订阅地址</h3>
          <p className="text-sm text-muted-foreground">
            输出中心会集中展示 Clash、v2rayN、Base64 明文和 sing-box 的订阅路径、健康检查与预览内容。
          </p>
        </div>
      </div>
      <div className="grid gap-3 rounded-lg border bg-muted/35 p-3">
        <FlowStep icon={KeyRound} label="创建令牌" />
        <FlowStep icon={Layers3} label="选择全部节点或部分节点" />
        <FlowStep icon={Link2} label="设置自定义订阅路径" />
        <FlowStep icon={ShieldCheck} label="复制、预览并检查输出" />
      </div>
      <Button className="w-fit" disabled type="button" variant="secondary">
        等待令牌
        <ArrowRight data-icon="inline-end" />
      </Button>
    </section>
  );
}

function SummaryCard({
  hint,
  icon: Icon,
  label,
  tone,
  value
}: {
  hint: string;
  icon: typeof KeyRound;
  label: string;
  tone: "accent" | "cyan" | "muted" | "primary";
  value: number | string;
}) {
  const toneClass = {
    primary: "text-primary bg-primary/10 border-primary/20",
    cyan: "text-chart-2 bg-chart-2/10 border-chart-2/20",
    accent: "text-chart-5 bg-chart-5/10 border-chart-5/20",
    muted: "text-muted-foreground bg-muted border-border"
  }[tone];

  return (
    <div className="flex min-h-36 flex-col justify-between gap-3 rounded-lg border bg-background/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`rounded-md border p-2 ${toneClass}`}>
          <Icon />
        </span>
      </div>
      <div className="grid gap-1">
        <strong className="text-3xl leading-none">{value}</strong>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background/70 px-3 py-2">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function FlowStep({ icon: Icon, label }: { icon: typeof KeyRound; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-muted/45 px-3 py-2 text-sm">
      <Icon className="text-primary" />
      <span>{label}</span>
    </div>
  );
}

function recentUsageCount(tokens: SubscribeTokenDto[]) {
  return tokens.filter((token) => token.last_used_at).length;
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NodeDto, ProfileDto, SubscribeTokenDto } from "@smagicalsub/shared";
import { ArrowRight, Clock3, KeyRound, Layers3, Link2, Route, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { EmptyState } from "../../shared/EmptyState";
import { ListPagination } from "../../shared/ListPagination";
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
      description="面向 Clash、Base64、明文、sing-box 和 Xray 的订阅分发工作台。"
      tone="cyan"
    >
      <TokenHero tokens={page.tokens} nodes={page.nodes} profiles={page.profiles} />

      <div className="grid gap-4 2xl:grid-cols-[minmax(360px,0.96fr)_minmax(520px,1.04fr)]">
        <TokenForm
          form={page.form}
          nodes={page.nodes}
          pending={page.pending}
          profileModules={page.profileModules}
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
        <div className="grid gap-3">
          <TokensTable
            copyFormat={page.copyFormat}
            editForm={page.editForm}
            editingTokenId={page.editingTokenId}
            pending={page.pending}
            profiles={page.profiles}
            profileModules={page.profileModules}
            nodes={page.nodes}
            tokens={page.paginatedTokens}
            total={page.filteredTokens.length}
            onCancelEdit={page.resetEdit}
            onCopy={(token, format) => void page.handleCopy(token, format)}
            onDelete={page.deleteToken}
            onEditFormChange={page.setEditForm}
            onOpen={page.openSubscription}
            onReset={page.resetToken}
            onSaveEdit={page.saveEdit}
            onStartEdit={page.startEdit}
            onToggleEnabled={page.toggleEnabled}
          />
          <ListPagination
            currentPage={page.currentPage}
            label="令牌分页"
            onPageChange={page.setCurrentPage}
            onPageSizeChange={page.setPageSize}
            pageCount={page.pageCount}
            pageSize={page.pageSize}
            pageSizeOptions={page.pageSizeOptions}
            total={page.filteredTokens.length}
          />
        </div>
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
      <div className="grid gap-3 p-3 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
        <div className="grid gap-2.5 rounded-lg border bg-background/70 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Badge className="gap-1.5 border-chart-2/30 bg-chart-2/10 text-chart-2" variant="outline">
                <Sparkles />
                多格式订阅
              </Badge>
              <h2 className="truncate text-lg font-semibold leading-tight">订阅分发工作台</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <MiniStat label="启用节点" value={`${enabledNodes}/${nodes.length}`} />
              <MiniStat label="启用配置档" value={`${enabledProfiles}/${profiles.length}`} />
            </div>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            创建令牌后绑定配置档、限制节点范围，并把自定义路径映射到专属订阅地址。
          </p>

          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-chart-2/25 bg-chart-2/10 px-2.5 py-2">
            <div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-chart-2">
              <Zap className="text-chart-2" />
              输出能力
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              <Badge variant="secondary">Clash</Badge>
              <Badge variant="secondary">Base64</Badge>
              <Badge variant="secondary">明文</Badge>
              <Badge variant="secondary">sing-box</Badge>
              <Badge variant="secondary">Xray</Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-4">
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
            输出中心会集中展示 Clash、Base64、明文、sing-box 和 Xray 的订阅路径、健康检查与预览内容。
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
    <div className="flex min-h-20 items-center gap-3 rounded-lg border bg-background/70 p-3">
      <span className={`rounded-md border p-2 ${toneClass}`}>
        <Icon />
      </span>
      <div className="grid min-w-0 flex-1 gap-1">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
          <strong className="font-mono text-xl leading-none">{value}</strong>
        </div>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border bg-background/70 px-2.5 py-1 text-xs">
      <span className="font-medium text-muted-foreground">{label}</span>
      <strong className="font-mono">{value}</strong>
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

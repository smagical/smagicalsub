import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, FileText } from "lucide-react";
import { EmptyState } from "../../shared/EmptyState";
import { ModulePanel } from "../../shared/ModulePanel";
import { PageFeedback } from "../../shared/PageFeedback";
import { TokenFilters } from "./TokenFilters";
import { TokenForm } from "./TokenForm";
import { TokensTable } from "./TokensTable";
import { exportTokensCsv, subscriptionFormatPath } from "./utils";
import { tokenFormatHints } from "./types";
import { useTokensPage } from "./useTokensPage";

export function TokensPage() {
  const page = useTokensPage();
  const previewToken = page.filteredTokens[0] ?? null;

  return (
    <ModulePanel eyebrow="Tokens" title="订阅令牌" description="创建订阅访问令牌，控制启停、过期、重置和删除。">
      <TokenForm form={page.form} pending={page.pending} profiles={page.profiles} setForm={page.setForm} onSubmit={page.createToken} />
      {previewToken ? (
        <section aria-label="订阅输出中心" className="rounded-lg border bg-card/70 p-3 shadow-sm ring-1 ring-primary/10">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="grid gap-1">
              <span className="text-xs font-semibold text-muted-foreground">订阅输出中心</span>
              <p className="font-mono text-xs">{subscriptionFormatPath(previewToken.token, page.copyFormat)}</p>
              <p className="text-sm text-muted-foreground">{tokenFormatHints[page.copyFormat]}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => void page.handleCopy(previewToken)} size="sm" type="button" variant="outline">
                <Copy data-icon="inline-start" />
                复制当前格式
              </Button>
              <Button disabled={page.previewPending} onClick={() => void page.previewSubscription(previewToken)} size="sm" type="button" variant="outline">
                <FileText data-icon="inline-start" />
                加载预览
              </Button>
              <Button onClick={() => page.openSubscription(previewToken)} size="sm" type="button" variant="ghost">
                <ExternalLink data-icon="inline-start" />
                打开预览
              </Button>
            </div>
          </div>
          {page.previewError ? <p className="mt-3 text-sm text-destructive">{page.previewError}</p> : null}
          {page.previewContent ? (
            <pre className="mt-3 max-h-56 overflow-auto rounded-md bg-muted/50 p-3 font-mono text-xs">{page.previewContent}</pre>
          ) : null}
        </section>
      ) : null}
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

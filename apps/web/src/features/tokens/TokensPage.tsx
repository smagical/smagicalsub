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
    <ModulePanel eyebrow="Tokens" title="订阅令牌" description="创建订阅访问令牌，控制启停、过期、重置和删除。">
      <TokenForm form={page.form} pending={page.pending} profiles={page.profiles} setForm={page.setForm} onSubmit={page.createToken} />
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

import { EmptyState } from "../../shared/EmptyState";
import { ModuleHeading } from "../../shared/ModuleHeading";
import { TokenFilters } from "./TokenFilters";
import { TokenForm } from "./TokenForm";
import { TokensTable } from "./TokensTable";
import { useTokensPage } from "./useTokensPage";

export function TokensPage() {
  const page = useTokensPage();

  return (
    <section className="panel wide">
      <ModuleHeading eyebrow="Tokens" title="订阅令牌" description="创建订阅访问令牌，控制启停、过期、重置和删除。" />
      <TokenForm form={page.form} pending={page.pending} profiles={page.profiles} setForm={page.setForm} onSubmit={page.createToken} />
      <TokenFilters
        copyFormat={page.copyFormat}
        searchQuery={page.searchQuery}
        onCopyFormatChange={page.setCopyFormat}
        onSearchQueryChange={page.setSearchQuery}
      />

      {page.notice ? <p className="success-text">{page.notice}</p> : null}
      {page.error instanceof Error ? <p className="error-text">{page.error.message}</p> : null}

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
          onDelete={page.deleteWithConfirm}
          onEditFormChange={page.setEditForm}
          onOpen={page.openSubscription}
          onProfileChange={page.updateProfileBinding}
          onReset={page.resetWithConfirm}
          onSaveEdit={page.saveEdit}
          onStartEdit={page.startEdit}
          onToggleEnabled={page.toggleEnabled}
        />
      )}
    </section>
  );
}

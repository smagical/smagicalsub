import { EmptyState } from "../../shared/EmptyState";
import { ModuleHeading } from "../../shared/ModuleHeading";
import { SourceFilters } from "./SourceFilters";
import { SourceForm } from "./SourceForm";
import { SourcesTable } from "./SourcesTable";
import { exportSourcesCsv } from "./utils";
import { useSourcesPage } from "./useSourcesPage";

export function SourcesPage() {
  const page = useSourcesPage();

  return (
    <section className="panel wide">
      <ModuleHeading eyebrow="Sources" title="订阅源" description="管理上游订阅链接、刷新状态和拉取结果。" />

      <SourceForm form={page.form} pending={page.pending} setForm={page.setForm} onSubmit={page.createSource} />
      <SourceFilters
        exportDisabled={page.filteredSources.length === 0}
        pending={page.pending}
        searchQuery={page.searchQuery}
        sourceCount={page.sourceCount}
        statusFilter={page.statusFilter}
        onExport={() => exportSourcesCsv(page.filteredSources)}
        onRefreshAll={page.refreshAll}
        onSearchQueryChange={page.setSearchQuery}
        onStatusFilterChange={page.setStatusFilter}
      />

      {page.notice ? <p className="success-text">{page.notice}</p> : null}
      {page.error instanceof Error ? <p className="error-text">{page.error.message}</p> : null}

      {page.filteredSources.length === 0 ? (
        <EmptyState label={page.emptyLabel} />
      ) : (
        <SourcesTable
          editForm={page.editForm}
          editingSourceId={page.editingSourceId}
          pending={page.pending}
          sources={page.filteredSources}
          onCancelEdit={page.resetEdit}
          onDelete={page.deleteSource}
          onEditFormChange={page.setEditForm}
          onRefresh={page.refreshSource}
          onSaveEdit={page.saveEdit}
          onStartEdit={page.startEdit}
          onToggleEnabled={page.toggleEnabled}
        />
      )}
    </section>
  );
}

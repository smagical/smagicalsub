import { EmptyState } from "../../shared/EmptyState";
import { ModulePanel } from "../../shared/ModulePanel";
import { PageFeedback } from "../../shared/PageFeedback";
import { SourceFilters } from "./SourceFilters";
import { SourceForm } from "./SourceForm";
import { SourcesTable } from "./SourcesTable";
import { exportSourcesCsv } from "./utils";
import { useSourcesPage } from "./useSourcesPage";

export function SourcesPage() {
  const page = useSourcesPage();

  return (
    <ModulePanel eyebrow="Sources" title="订阅源" description="管理上游订阅链接、刷新状态和拉取结果。">
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

      <PageFeedback error={page.error} notice={page.notice} />

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
    </ModulePanel>
  );
}

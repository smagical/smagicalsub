import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "../../shared/EmptyState";
import { ListPagination } from "../../shared/ListPagination";
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
    <ModulePanel eyebrow="Sources" title="订阅源" description="管理上游订阅链接、刷新状态和拉取结果。" tone="green">
      <Card>
        <CardHeader>
          <CardTitle>新增订阅源</CardTitle>
          <CardDescription>填写名称、订阅链接和自动刷新频率，创建后会进入下方订阅列表。</CardDescription>
        </CardHeader>
        <CardContent>
          <SourceForm className="mb-0" form={page.form} groups={page.groups} pending={page.pending} setForm={page.setForm} onSubmit={page.createSource} />
        </CardContent>
      </Card>

      <SourceSection description="按名称、链接、错误内容或刷新状态筛选订阅源。" title="筛选订阅源">
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
      </SourceSection>

      <PageFeedback error={page.error} notice={page.notice} />

      <SourceSection description="订阅源列表现在按单列展示，避免宽屏下一行两个卡片过于紧密。" title="订阅列表">
        {page.filteredSources.length === 0 ? (
          <EmptyState label={page.emptyLabel} />
        ) : (
          <div className="grid gap-3">
            <SourcesTable
              editForm={page.editForm}
              editingSourceId={page.editingSourceId}
              groups={page.groups}
              pending={page.pending}
              sources={page.paginatedSources}
              onCancelEdit={page.resetEdit}
              onDelete={page.deleteSource}
              onEditFormChange={page.setEditForm}
              onRefresh={page.refreshSource}
              onSaveEdit={page.saveEdit}
              onStartEdit={page.startEdit}
              onToggleEnabled={page.toggleEnabled}
            />
            <ListPagination
              currentPage={page.currentPage}
              label="订阅分页"
              onPageChange={page.setCurrentPage}
              onPageSizeChange={page.setPageSize}
              pageCount={page.pageCount}
              pageSize={page.pageSize}
              pageSizeOptions={page.pageSizeOptions}
              total={page.filteredSources.length}
            />
          </div>
        )}
      </SourceSection>
    </ModulePanel>
  );
}

function SourceSection({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return (
    <section className="grid gap-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2 border-l-[4px] border-l-chart-3 px-3">
        <div className="grid gap-0.5">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

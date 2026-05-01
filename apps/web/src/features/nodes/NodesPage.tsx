import { EmptyState } from "../../shared/EmptyState";
import { ModulePanel } from "../../shared/ModulePanel";
import { PageFeedback } from "../../shared/PageFeedback";
import { NodeBatchBar, NodeFilters } from "./NodeFilters";
import { NodeForm } from "./NodeForm";
import { NodesTable } from "./NodesTable";
import { exportNodesCsv } from "./utils";
import { useNodesPage } from "./useNodesPage";

export function NodesPage() {
  const page = useNodesPage();

  return (
    <ModulePanel eyebrow="Nodes" title="节点" description="添加单个节点，按分组查看订阅源解析和手动维护的节点。">
      <NodeForm form={page.form} pending={page.pending} setForm={page.setForm} onSubmit={page.createNode} />
      <NodeFilters
        exportDisabled={page.filteredNodes.length === 0}
        groups={page.groups}
        groupFilter={page.groupFilter}
        searchQuery={page.searchQuery}
        onExport={() => exportNodesCsv(page.filteredNodes)}
        onGroupFilterChange={page.setGroupFilter}
        onSearchQueryChange={page.setSearchQuery}
      />
      <NodeBatchBar
        batchGroups={page.batchGroups}
        pending={page.pending}
        selectedCount={page.selectedNodeIds.length}
        onAction={page.runBatchAction}
        onBatchGroupsChange={page.setBatchGroups}
        onClearSelection={page.clearSelection}
      />

      <PageFeedback error={page.error} notice={page.notice} />

      {page.filteredNodes.length === 0 ? (
        <EmptyState label={page.emptyLabel} />
      ) : (
        <NodesTable
          allVisibleSelected={page.allVisibleSelected}
          editForm={page.editForm}
          editingNodeId={page.editingNodeId}
          nodes={page.filteredNodes}
          pending={page.pending}
          selectedNodeIds={page.selectedNodeIds}
          onCancelEdit={page.resetEdit}
          onDelete={page.deleteNode}
          onEditFormChange={page.setEditForm}
          onSaveEdit={page.saveEdit}
          onStartEdit={page.startEdit}
          onToggleEnabled={page.toggleEnabled}
          onToggleSelected={page.toggleSelected}
          onToggleVisible={page.toggleVisible}
        />
      )}
    </ModulePanel>
  );
}

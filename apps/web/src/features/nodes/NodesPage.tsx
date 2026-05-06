import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { NodeDto } from "@smagicalsub/shared";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Layers3, RadioTower, Server, SquareCheckBig } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState } from "../../shared/EmptyState";
import { ListPagination } from "../../shared/ListPagination";
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
    <ModulePanel eyebrow="Nodes" title="节点" description="添加单个节点，按分组查看订阅源解析和手动维护的节点。" tone="blue">
      <NodeSummary filteredCount={page.filteredNodes.length} nodes={page.nodes} selectedCount={page.selectedNodeIds.length} />

      <Card>
        <CardHeader>
          <CardTitle>添加节点</CardTitle>
          <CardDescription>直接粘贴节点链接，可补充显示名称和分组，创建后会进入下方节点列表。</CardDescription>
        </CardHeader>
        <CardContent>
          <NodeForm className="mb-0" form={page.form} pending={page.pending} setForm={page.setForm} onSubmit={page.createNode} />
        </CardContent>
      </Card>

      <NodeSection description="按名称、协议、服务端或分组筛选节点，并导出当前结果。" title="筛选节点">
        <NodeFilters
          exportDisabled={page.filteredNodes.length === 0}
          groups={page.groups}
          groupFilter={page.groupFilter}
          nodeCount={page.filteredNodes.length}
          protocolFilter={page.protocolFilter}
          protocols={page.protocols}
          searchQuery={page.searchQuery}
          totalCount={page.nodes.length}
          onExport={() => exportNodesCsv(page.filteredNodes)}
          onGroupFilterChange={page.setGroupFilter}
          onProtocolFilterChange={page.setProtocolFilter}
          onSearchQueryChange={page.setSearchQuery}
        />
      </NodeSection>

      <NodeSection description="勾选节点后可以批量启停、覆盖分组、追加分组或删除。" title="批量操作">
        <NodeBatchBar
          batchGroups={page.batchGroups}
          pending={page.pending}
          selectedCount={page.selectedNodeIds.length}
          onAction={page.runBatchAction}
          onBatchGroupsChange={page.setBatchGroups}
          onClearSelection={page.clearSelection}
        />
      </NodeSection>

      <PageFeedback error={page.error} notice={page.notice} />

      <NodeSection description="节点按单列卡片展示，方便查看协议、来源、服务端和分组。" title="节点列表">
        {page.filteredNodes.length === 0 ? (
          <EmptyState label={page.emptyLabel} />
        ) : (
          <div className="grid gap-3">
            <NodesTable
              allVisibleSelected={page.allVisibleSelected}
              editForm={page.editForm}
              editingNodeId={page.editingNodeId}
              nodes={page.paginatedNodes}
              pending={page.pending}
              selectedNodeIds={page.selectedNodeIds}
              onCancelEdit={page.resetEdit}
              onCopy={page.copyNode}
              onDelete={page.deleteNode}
              onEditFormChange={page.setEditForm}
              onSaveEdit={page.saveEdit}
              onStartEdit={page.startEdit}
              onToggleEnabled={page.toggleEnabled}
              onToggleSelected={page.toggleSelected}
              onToggleVisible={page.toggleVisible}
            />
            <ListPagination
              currentPage={page.currentPage}
              label="节点分页"
              onPageChange={page.setCurrentPage}
              pageCount={page.pageCount}
              total={page.filteredNodes.length}
            />
          </div>
        )}
      </NodeSection>
    </ModulePanel>
  );
}

function NodeSummary({ filteredCount, nodes, selectedCount }: { filteredCount: number; nodes: NodeDto[]; selectedCount: number }) {
  const enabledCount = nodes.filter((node) => Boolean(node.enabled)).length;
  const manualCount = nodes.filter((node) => !node.source_id).length;
  const sourceCount = nodes.length - manualCount;
  const groupCount = new Set(nodes.flatMap((node) => node.groups)).size;
  const protocolCount = new Set(nodes.map((node) => node.protocol)).size;

  return (
    <section className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[minmax(260px,0.72fr)_minmax(0,1.28fr)]">
      <div className="flex min-h-40 flex-col justify-between gap-3 rounded-lg border bg-background/70 p-4">
        <div className="grid gap-2">
          <Badge className="w-fit gap-1.5 border-primary/30 bg-primary/10 text-primary" variant="outline">
            <RadioTower />
            节点库
          </Badge>
          <div className="grid gap-1">
            <h3 className="text-xl font-semibold leading-tight">节点接入与筛选中心</h3>
            <p className="text-sm text-muted-foreground">手动节点和订阅源节点统一维护，后续令牌可以按节点范围自由定制输出。</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="border-chart-2/30 bg-chart-2/10 text-chart-2" variant="outline">
            手动 {manualCount}
          </Badge>
          <Badge className="border-chart-3/30 bg-chart-3/10 text-chart-3" variant="outline">
            订阅源 {sourceCount}
          </Badge>
          <Badge className="border-chart-4/30 bg-chart-4/10 text-chart-4" variant="outline">
            分组 {groupCount}
          </Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NodeSummaryCard icon={Server} label="节点总数" tone="primary" value={nodes.length} />
        <NodeSummaryCard icon={CheckCircle2} label="启用节点" tone="success" value={enabledCount} />
        <NodeSummaryCard icon={Layers3} label="协议类型" tone="cyan" value={protocolCount} />
        <NodeSummaryCard icon={SquareCheckBig} label="当前筛选 / 已选" tone="warning" value={`${filteredCount}/${selectedCount}`} />
      </div>
    </section>
  );
}

function NodeSummaryCard({ icon: Icon, label, tone, value }: { icon: LucideIcon; label: string; tone: NodeSummaryTone; value: number | string }) {
  return (
    <div className="flex min-h-32 flex-col justify-between gap-3 rounded-lg border bg-background/70 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`rounded-md border p-2 ${summaryToneClasses[tone]}`}>
          <Icon />
        </span>
      </div>
      <strong className="font-mono text-3xl leading-none">{value}</strong>
    </div>
  );
}

function NodeSection({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return (
    <section className="grid gap-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2 border-l-[4px] border-l-primary px-3">
        <div className="grid gap-0.5">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

type NodeSummaryTone = "cyan" | "primary" | "success" | "warning";

const summaryToneClasses: Record<NodeSummaryTone, string> = {
  cyan: "border-chart-2/20 bg-chart-2/10 text-chart-2",
  primary: "border-primary/20 bg-primary/10 text-primary",
  success: "border-chart-3/20 bg-chart-3/10 text-chart-3",
  warning: "border-chart-4/20 bg-chart-4/10 text-chart-4"
};

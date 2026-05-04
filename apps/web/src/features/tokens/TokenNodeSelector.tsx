import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { NodeDto } from "@smagicalsub/shared";
import { Check, Layers3, RadioTower, Search, Server, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";

type TokenNodeSelectorProps = {
  compact?: boolean;
  disabled?: boolean;
  nodes: NodeDto[];
  selectedIds: string[];
  onChange: (nodeIds: string[]) => void;
};

export function TokenNodeSelector({ compact = false, disabled = false, nodes, selectedIds, onChange }: TokenNodeSelectorProps) {
  const [query, setQuery] = useState("");
  const [protocolFilter, setProtocolFilter] = useState("all");
  const protocolOptions = useMemo(() => protocolSummaries(nodes), [nodes]);
  const visibleNodes = useMemo(() => filterNodes(nodes, query, protocolFilter), [nodes, protocolFilter, query]);
  const allMode = selectedIds.length === 0;
  const summary = selectorSummary(nodes, visibleNodes, selectedIds);
  const selectedPreview = allMode ? nodes.filter((node) => node.enabled).slice(0, 3) : getSelectedPreview(nodes, selectedIds);

  if (nodes.length === 0) {
    return <Badge variant="secondary">无可选节点</Badge>;
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b bg-muted/35 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Layers3 />
              节点范围
            </div>
            <p className="text-xs text-muted-foreground">空选择表示输出所有启用节点；点选后只输出选中的节点。</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              disabled={disabled}
              onClick={() => onChange([])}
              size="sm"
              type="button"
              variant={selectedIds.length === 0 ? "secondary" : "outline"}
            >
              <Sparkles data-icon="inline-start" />
              全部启用
            </Button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              disabled={disabled}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索节点名称或协议"
              value={query}
            />
          </div>
          <Button
            disabled={disabled || (query.trim() === "" && protocolFilter === "all")}
            onClick={() => {
              setQuery("");
              setProtocolFilter("all");
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            <X data-icon="inline-start" />
            清空搜索
          </Button>
        </div>
        {compact ? null : (
          <div className="mt-3 flex flex-wrap gap-2">
            <ProtocolFilterPill
              active={protocolFilter === "all"}
              disabled={disabled}
              label="全部协议"
              value={nodes.length}
              onClick={() => setProtocolFilter("all")}
            />
            {protocolOptions.map((option) => (
              <ProtocolFilterPill
                active={protocolFilter === option.protocol}
                disabled={disabled}
                key={option.protocol}
                label={option.protocol}
                value={option.count}
                onClick={() => setProtocolFilter(option.protocol)}
              />
            ))}
          </div>
        )}
        <div className={cn("mt-3 grid gap-2", compact ? "grid-cols-1" : "sm:grid-cols-3")}>
          <SummaryMetric label="当前范围" value={summary.scopeLabel} />
          {compact ? null : (
            <>
              <SummaryMetric label="显示节点" value={`${visibleNodes.length} / ${nodes.length}`} />
              <SummaryMetric label="可用节点" value={`${summary.enabledCount} / ${nodes.length}`} />
              <SummaryMetric label="协议类型" value={`${summary.protocolCount} 类`} />
            </>
          )}
        </div>
        {compact ? null : selectedPreview.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">已选节点</span>
            {selectedPreview.map((node) => (
              <Badge key={node.id} variant="secondary">
                {node.name}
              </Badge>
            ))}
            {allMode ? <span>自动包含全部启用节点</span> : selectedIds.length > selectedPreview.length ? <span>+{selectedIds.length - selectedPreview.length}</span> : null}
          </div>
        ) : null}
      </div>

      <div className={cn("grid gap-3 overflow-auto p-3", compact ? "max-h-64" : "max-h-80")}>
        {visibleNodes.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-background/50 px-4 py-6 text-center text-sm text-muted-foreground">
            没有匹配的节点，尝试清空搜索或调整关键词。
          </div>
        ) : null}
        {groupNodesByProtocol(visibleNodes).map((group, index) => (
          <section className="grid gap-2 overflow-hidden rounded-lg border bg-background/65" key={group.protocol}>
            <div className="flex items-center justify-between gap-2 bg-muted/35 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className={cn("grid size-8 place-items-center rounded-md border", protocolTone(index))}>
                  <RadioTower />
                </span>
                <Badge variant="outline">{group.protocol}</Badge>
                <span className="text-xs text-muted-foreground">{group.nodes.length} 个节点</span>
              </div>
              <Badge variant="secondary">{group.nodes.filter((node) => Boolean(node.enabled)).length} 个可用</Badge>
            </div>
            <div className={cn("grid gap-2 p-2", compact ? "grid-cols-1" : "md:grid-cols-2")}>
              {group.nodes.map((node) => (
                <NodeChoice
                  disabled={disabled}
                  key={node.id}
                  node={node}
                  checked={allMode ? Boolean(node.enabled) : selectedIds.includes(node.id)}
                  selected={allMode ? Boolean(node.enabled) : selectedIds.includes(node.id)}
                  onToggle={(checked) => onToggle(node.id, checked, selectedIds, nodes, onChange)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function NodeChoice({
  disabled,
  checked,
  node,
  selected,
  onToggle
}: {
  disabled: boolean;
  checked: boolean;
  node: NodeDto;
  selected: boolean;
  onToggle: (checked: boolean) => void;
}) {
  const enabled = Boolean(node.enabled);

  return (
    <label
      className={cn(
        "grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-xl border bg-background/85 p-3 text-sm transition hover:bg-muted/45",
        selected && "border-primary/50 bg-primary/5 ring-1 ring-primary/20",
        !enabled && "opacity-70"
      )}
    >
      <Checkbox checked={checked} disabled={disabled} onCheckedChange={(value) => onToggle(value === true)} />
      <span className="grid min-w-0 gap-2">
        <span className="flex min-w-0 items-start justify-between gap-2">
          <span className="truncate font-medium">{node.name}</span>
          {selected ? <Check /> : null}
        </span>
        <span className="flex flex-wrap items-center gap-1">
          <Badge variant="outline">{node.protocol}</Badge>
          <Badge variant={node.source_id ? "secondary" : "outline"}>
            <Server />
            {node.source_id ? "订阅源" : "手动"}
          </Badge>
          {enabled ? <Badge variant="secondary">可用</Badge> : <Badge variant="destructive">停用</Badge>}
        </span>
      </span>
    </label>
  );
}

function ProtocolFilterPill({
  active,
  disabled,
  label,
  value,
  onClick
}: {
  active: boolean;
  disabled: boolean;
  label: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <Button disabled={disabled} onClick={onClick} size="sm" type="button" variant={active ? "secondary" : "outline"}>
      {label}
      <Badge variant="outline">{value}</Badge>
    </Button>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/75 px-3 py-2">
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
      <div className="truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function protocolTone(index: number) {
  return [
    "border-primary/25 bg-primary/10 text-primary",
    "border-chart-2/25 bg-chart-2/10 text-chart-2",
    "border-chart-3/25 bg-chart-3/10 text-chart-3",
    "border-border bg-muted text-muted-foreground"
  ][index % 4];
}

function selectorSummary(nodes: NodeDto[], visibleNodes: NodeDto[], selectedIds: string[]) {
  const enabledCount = nodes.filter((node) => Boolean(node.enabled)).length;
  const protocols = Array.from(new Set(visibleNodes.map((node) => node.protocol))).sort((a, b) => a.localeCompare(b));

  return {
    enabledCount,
    protocolCount: protocols.length,
    scopeLabel: selectedIds.length === 0 ? "全部启用节点" : `已选 ${selectedIds.length} 个`
  };
}

function getSelectedPreview(nodes: NodeDto[], selectedIds: string[]) {
  const selected = new Set(selectedIds);
  return nodes.filter((node) => selected.has(node.id)).slice(0, 3);
}

function filterNodes(nodes: NodeDto[], query: string, protocolFilter: string) {
  const value = query.trim().toLowerCase();
  const filteredByProtocol = protocolFilter === "all" ? nodes : nodes.filter((node) => node.protocol === protocolFilter);

  if (!value) {
    return filteredByProtocol;
  }

  return filteredByProtocol.filter((node) => node.name.toLowerCase().includes(value) || node.protocol.toLowerCase().includes(value));
}

function protocolSummaries(nodes: NodeDto[]) {
  const counts = new Map<string, number>();

  for (const node of nodes) {
    counts.set(node.protocol, (counts.get(node.protocol) ?? 0) + 1);
  }

  return Array.from(counts, ([protocol, count]) => ({ protocol, count })).sort((a, b) => a.protocol.localeCompare(b.protocol));
}

function groupNodesByProtocol(nodes: NodeDto[]) {
  const groups = new Map<string, NodeDto[]>();

  for (const node of nodes) {
    const protocolNodes = groups.get(node.protocol) ?? [];
    protocolNodes.push(node);
    groups.set(node.protocol, protocolNodes);
  }

  return Array.from(groups, ([protocol, protocolNodes]) => ({
    protocol,
    nodes: protocolNodes.sort((a, b) => Number(b.enabled) - Number(a.enabled) || a.name.localeCompare(b.name))
  })).sort((a, b) => a.protocol.localeCompare(b.protocol));
}

function onToggle(id: string, checked: boolean, selectedIds: string[], nodes: NodeDto[], onChange: (nodeIds: string[]) => void) {
  const baseSelected = selectedIds.length === 0 ? nodes.filter((node) => node.enabled).map((node) => node.id) : selectedIds;

  onChange(checked ? Array.from(new Set([...baseSelected, id])) : baseSelected.filter((nodeId) => nodeId !== id));
}

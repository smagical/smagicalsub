import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { NodeDto } from "@smagicalsub/shared";
import { Check, ChevronDown, Layers3, RadioTower, Search, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { TagInput } from "../../shared/TagInput";
import { nodeSourceLabel, splitNodeGroups, UNGROUPED_GROUP_LABEL } from "../nodes/utils";

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
  const [groupFilters, setGroupFilters] = useState<string[]>([]);
  const [includeUngrouped, setIncludeUngrouped] = useState(false);
  const protocolOptions = useMemo(() => protocolSummaries(nodes), [nodes]);
  const groupOptions = useMemo(() => groupSummaries(nodes), [nodes]);
  const ungroupedCount = useMemo(() => countUngroupedNodes(nodes), [nodes]);
  const visibleNodes = useMemo(
    () => filterNodes(nodes, query, protocolFilter, groupFilters, includeUngrouped),
    [groupFilters, includeUngrouped, nodes, protocolFilter, query]
  );
  const allMode = selectedIds.length === 0;
  const summary = selectorSummary(nodes, visibleNodes, selectedIds);
  const selectedPreview = allMode ? nodes.filter((node) => node.enabled).slice(0, 3) : getSelectedPreview(nodes, selectedIds);
  const selectedGroupCount = groupFilters.length + (includeUngrouped ? 1 : 0);

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

        <div className="mt-3 grid gap-2 xl:grid-cols-[minmax(220px,1fr)_minmax(300px,1.1fr)_auto]">
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
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <TagInput
              ariaLabel="令牌节点分组筛选"
              className="min-w-0 flex-1"
              disabled={disabled}
              onChange={setGroupFilters}
              placeholder="输入分组并回车"
              suggestions={groupOptions.map((option) => option.group)}
              value={groupFilters}
            />
            <Button
              className="shrink-0"
              disabled={disabled}
              onClick={() => setIncludeUngrouped((current) => !current)}
              size="sm"
              type="button"
              variant={includeUngrouped ? "info" : "outline"}
            >
              {UNGROUPED_GROUP_LABEL}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button className="shrink-0" disabled={disabled} size="sm" type="button" variant="outline">
                  快速选择
                  {selectedGroupCount > 0 ? <Badge variant="secondary">{selectedGroupCount}</Badge> : null}
                  <ChevronDown data-icon="inline-end" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="grid gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid gap-0.5">
                      <span className="text-sm font-semibold">分组快速选择</span>
                      <span className="text-xs text-muted-foreground">点击可多选，也可直接输入分组</span>
                    </div>
                    <Button
                      disabled={selectedGroupCount === 0}
                      onClick={() => {
                        setGroupFilters([]);
                        setIncludeUngrouped(false);
                      }}
                      size="xs"
                      type="button"
                      variant="ghost"
                    >
                      清空
                    </Button>
                  </div>
                  <div className="grid gap-1">
                    <GroupFilterItem
                      checked={includeUngrouped}
                      count={ungroupedCount}
                      label={UNGROUPED_GROUP_LABEL}
                      onClick={() => setIncludeUngrouped((current) => !current)}
                    />
                    <div className="h-px bg-border" />
                    <div className="max-h-56 overflow-y-auto pr-1">
                      <div className="grid gap-1">
                        {groupOptions.length === 0 ? (
                          <div className="px-2 py-3 text-xs text-muted-foreground">暂无可选分组</div>
                        ) : (
                          groupOptions.map((option) => (
                            <GroupFilterItem
                              checked={groupFilters.includes(option.group)}
                              count={option.count}
                              key={option.group}
                              label={option.group}
                              onClick={() =>
                                setGroupFilters(
                                  groupFilters.includes(option.group)
                                    ? groupFilters.filter((value) => value !== option.group)
                                    : [...groupFilters, option.group]
                                )
                              }
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Button
            disabled={disabled || (query.trim() === "" && protocolFilter === "all" && groupFilters.length === 0 && !includeUngrouped)}
            onClick={() => {
              setQuery("");
              setProtocolFilter("all");
              setGroupFilters([]);
              setIncludeUngrouped(false);
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            <X data-icon="inline-start" />
            清空筛选
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
        <div className={cn("mt-3 grid gap-2", compact ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4")}>
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
        "flex cursor-pointer items-center gap-3 rounded-xl border bg-background/85 p-2.5 text-sm transition hover:bg-muted/45",
        selected && "border-primary/50 bg-primary/5 ring-1 ring-primary/20",
        !enabled && "opacity-70"
      )}
    >
      <Checkbox checked={checked} disabled={disabled} onCheckedChange={(value) => onToggle(value === true)} />
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <span className="min-w-0 truncate font-medium">{node.name}</span>
        <span className="flex shrink-0 items-center gap-1">
          <Badge className="h-5 px-1.5 text-[11px]" variant="outline">
            {node.protocol}
          </Badge>
          <Badge className="h-5 px-1.5 text-[11px]" variant={node.source_ids.length > 0 || node.source_id ? "secondary" : "outline"}>
            {nodeSourceLabel(node).replace("源", "")}
          </Badge>
          {enabled ? <Badge className="h-5 px-1.5 text-[11px]" variant="secondary">可用</Badge> : <Badge className="h-5 px-1.5 text-[11px]" variant="destructive">停用</Badge>}
        </span>
      </span>
      {selected ? <Check className="shrink-0 text-primary" /> : null}
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

function GroupFilterItem({
  checked,
  count,
  label,
  onClick
}: {
  checked: boolean;
  count: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
        checked && "bg-primary/10 text-primary"
      )}
      onClick={onClick}
      type="button"
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-sm border",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"
        )}
      >
        {checked ? <Check data-icon="inline-start" /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Badge className="shrink-0" variant="outline">
        {count}
      </Badge>
    </button>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-lg border bg-background/75 px-2.5 py-1.5 text-xs">
      <span className="shrink-0 font-medium text-muted-foreground">{label}</span>
      <strong className="min-w-0 truncate text-right font-semibold">{value}</strong>
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

function filterNodes(
  nodes: NodeDto[],
  query: string,
  protocolFilter: string,
  groupFilters: string[],
  includeUngrouped: boolean
) {
  const value = query.trim().toLowerCase();
  const filteredByProtocol = protocolFilter === "all" ? nodes : nodes.filter((node) => node.protocol === protocolFilter);
  const groupFilterSet = new Set(groupFilters);
  const filteredByGroup =
    groupFilterSet.size === 0 && !includeUngrouped
      ? filteredByProtocol
      : filteredByProtocol.filter((node) => {
          const nodeGroups = splitNodeGroups(node.groups);
          const matchesUngrouped = includeUngrouped && nodeGroups.length === 0;
          const matchesGroup = nodeGroups.some((group) => groupFilterSet.has(group));

          return matchesUngrouped || matchesGroup;
        });

  if (!value) {
    return filteredByGroup;
  }

  return filteredByGroup.filter(
    (node) =>
      node.name.toLowerCase().includes(value) ||
      node.protocol.toLowerCase().includes(value) ||
      splitNodeGroups(node.groups).some((group) => group.toLowerCase().includes(value))
  );
}

function protocolSummaries(nodes: NodeDto[]) {
  const counts = new Map<string, number>();

  for (const node of nodes) {
    counts.set(node.protocol, (counts.get(node.protocol) ?? 0) + 1);
  }

  return Array.from(counts, ([protocol, count]) => ({ protocol, count })).sort((a, b) => a.protocol.localeCompare(b.protocol));
}

function groupSummaries(nodes: NodeDto[]) {
  const counts = new Map<string, number>();

  for (const node of nodes) {
    const nodeGroups = splitNodeGroups(node.groups);

    for (const group of nodeGroups) {
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
  }

  return Array.from(counts, ([group, count]) => ({ group, count })).sort((a, b) => a.group.localeCompare(b.group));
}

function countUngroupedNodes(nodes: NodeDto[]) {
  return nodes.filter((node) => splitNodeGroups(node.groups).length === 0).length;
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

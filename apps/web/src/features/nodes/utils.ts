import type { NodeDto } from "@smagicalsub/shared";
import { downloadCsv } from "../../lib/download-csv";

export const UNGROUPED_GROUP_LABEL = "无分组";

export function nodeSourceLabel(node: Pick<NodeDto, "manual" | "source_ids" | "source_id">) {
  const hasManual = Boolean(node.manual);
  const hasSource = node.source_ids.length > 0 || Boolean(node.source_id);

  if (hasManual && hasSource) {
    return "手动+订阅";
  }

  return hasSource ? "订阅源" : "手动";
}

export function toNodesCsvRows(nodes: NodeDto[]) {
  const header = ["名称", "协议", "服务端", "端口", "分组", "状态", "来源类型"];
  const rows = nodes.map((node) => [
    node.name,
    node.protocol,
    node.server,
    node.port,
    splitNodeGroups(node.groups).join(","),
    node.enabled ? "启用" : "停用",
    nodeSourceLabel(node)
  ]);

  return [header, ...rows];
}

export function exportNodesCsv(nodes: NodeDto[]) {
  downloadCsv("nodes", toNodesCsvRows(nodes));
}

export function nodeProtocols(nodes: NodeDto[]) {
  return Array.from(new Set(nodes.map((node) => node.protocol))).sort((a, b) => a.localeCompare(b));
}

export function splitNodeGroups(groups: string[]) {
  const normalizedGroups: string[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    for (const segment of group.split(/[\r\n,，;；]+/g)) {
      const value = segment.trim();

      if (!value || seen.has(value)) {
        continue;
      }

      seen.add(value);
      normalizedGroups.push(value);
    }
  }

  return normalizedGroups;
}

export function filterNodes(
  nodes: NodeDto[],
  groupFilters: string[],
  includeUngrouped: boolean,
  protocolFilter: string,
  searchQuery: string
) {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const hasGroupFilters = includeUngrouped || groupFilters.length > 0;
  const groupFilterSet = new Set(groupFilters);
  const grouped = !hasGroupFilters
    ? nodes
    : nodes.filter((node) => {
        const nodeGroups = splitNodeGroups(node.groups);
        const matchesUngrouped = includeUngrouped && nodeGroups.length === 0;
        const matchesGroup = groupFilterSet.size > 0 && nodeGroups.some((group) => groupFilterSet.has(group));

        return matchesUngrouped || matchesGroup;
      });
  const protocolNodes = protocolFilter === "all" ? grouped : grouped.filter((node) => node.protocol === protocolFilter);

  if (!normalizedSearch) {
    return protocolNodes;
  }

  return protocolNodes.filter((node) =>
    [node.name, node.protocol, node.server ?? "", String(node.port ?? ""), ...splitNodeGroups(node.groups)].some((value) =>
      value.toLowerCase().includes(normalizedSearch)
    )
  );
}

export function toggleSelectedId(selectedIds: string[], id: string, checked: boolean) {
  if (checked) {
    return selectedIds.includes(id) ? selectedIds : [...selectedIds, id];
  }

  return selectedIds.filter((selectedId) => selectedId !== id);
}

export function toggleVisibleSelection(selectedIds: string[], visibleIds: string[], checked: boolean) {
  if (checked) {
    return Array.from(new Set([...selectedIds, ...visibleIds]));
  }

  return selectedIds.filter((id) => !visibleIds.includes(id));
}

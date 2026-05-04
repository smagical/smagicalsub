import type { NodeDto } from "@smagicalsub/shared";
import { downloadCsv } from "../../lib/download-csv";

export function parseGroups(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((group) => group.trim())
        .filter(Boolean)
    )
  );
}

export function formatGroups(groups: string[]) {
  return groups.join(",");
}

export function toNodesCsvRows(nodes: NodeDto[]) {
  const header = ["名称", "协议", "服务端", "端口", "分组", "状态", "来源类型"];
  const rows = nodes.map((node) => [
    node.name,
    node.protocol,
    node.server,
    node.port,
    node.groups.join(","),
    node.enabled ? "启用" : "停用",
    node.source_id ? "订阅源" : "手动"
  ]);

  return [header, ...rows];
}

export function exportNodesCsv(nodes: NodeDto[]) {
  downloadCsv("nodes", toNodesCsvRows(nodes));
}

export function nodeProtocols(nodes: NodeDto[]) {
  return Array.from(new Set(nodes.map((node) => node.protocol))).sort((a, b) => a.localeCompare(b));
}

export function filterNodes(nodes: NodeDto[], groupFilter: string, protocolFilter: string, searchQuery: string) {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const grouped =
    groupFilter === "all"
      ? nodes
      : nodes.filter((node) => (groupFilter === "ungrouped" ? node.groups.length === 0 : node.groups.includes(groupFilter)));
  const protocolNodes = protocolFilter === "all" ? grouped : grouped.filter((node) => node.protocol === protocolFilter);

  if (!normalizedSearch) {
    return protocolNodes;
  }

  return protocolNodes.filter((node) =>
    [node.name, node.protocol, node.server ?? "", String(node.port ?? ""), ...node.groups].some((value) =>
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

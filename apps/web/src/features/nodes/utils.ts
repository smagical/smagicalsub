import type { NodeDto } from "@smagicalsub/shared";

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

function csvCell(value: string | number | null | undefined) {
  const normalized = value === null || value === undefined ? "" : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function toNodesCsv(nodes: NodeDto[]) {
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

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function exportNodesCsv(nodes: NodeDto[]) {
  // 页面只传入当前筛选结果，导出细节集中在工具函数里维护。
  const blob = new Blob([toNodesCsv(nodes)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nodes-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function filterNodes(nodes: NodeDto[], groupFilter: string, searchQuery: string) {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const grouped =
    groupFilter === "all"
      ? nodes
      : nodes.filter((node) => (groupFilter === "ungrouped" ? node.groups.length === 0 : node.groups.includes(groupFilter)));

  if (!normalizedSearch) {
    return grouped;
  }

  return grouped.filter((node) =>
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

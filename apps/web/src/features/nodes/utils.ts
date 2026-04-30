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

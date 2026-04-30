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

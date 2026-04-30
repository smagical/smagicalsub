export function StatusBadge({ enabled }: { enabled: number | boolean }) {
  const isEnabled = Boolean(enabled);
  return <span className={isEnabled ? "status-badge enabled" : "status-badge disabled"}>{isEnabled ? "启用" : "停用"}</span>;
}


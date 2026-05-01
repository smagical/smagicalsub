import { Badge } from "@/components/ui/badge";

export function StatusBadge({ enabled }: { enabled: number | boolean }) {
  const isEnabled = Boolean(enabled);
  return <Badge variant={isEnabled ? "secondary" : "outline"}>{isEnabled ? "启用" : "停用"}</Badge>;
}

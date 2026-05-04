import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { NodeDto } from "@smagicalsub/shared";

type TokenNodeSelectorProps = {
  disabled?: boolean;
  nodes: NodeDto[];
  selectedIds: string[];
  onChange: (nodeIds: string[]) => void;
};

export function TokenNodeSelector({ disabled = false, nodes, selectedIds, onChange }: TokenNodeSelectorProps) {
  if (nodes.length === 0) {
    return <Badge variant="secondary">无可选节点</Badge>;
  }

  return (
    <div className="max-h-32 overflow-auto rounded-md border bg-background/70 p-2">
      <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Checkbox checked={selectedIds.length === 0} disabled={disabled} onCheckedChange={() => onChange([])} />
        全部启用节点
      </label>
      <div className="grid gap-1">
        {nodes.map((node) => (
          <label className="flex items-center gap-2 text-xs" key={node.id}>
            <Checkbox
              checked={selectedIds.includes(node.id)}
              disabled={disabled}
              onCheckedChange={(value) => onToggle(node.id, value === true, selectedIds, onChange)}
            />
            <span className="truncate">{node.name}</span>
            <Badge variant="outline">{node.protocol}</Badge>
          </label>
        ))}
      </div>
    </div>
  );
}

function onToggle(id: string, checked: boolean, selectedIds: string[], onChange: (nodeIds: string[]) => void) {
  onChange(checked ? Array.from(new Set([...selectedIds, id])) : selectedIds.filter((nodeId) => nodeId !== id));
}

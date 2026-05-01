import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { NodeDto } from "@smagicalsub/shared";
import { StatusBadge } from "../../shared/StatusBadge";
import { NodeActions } from "./NodeActions";
import type { NodeEditFormState } from "./types";

type NodesTableProps = {
  editForm: NodeEditFormState;
  editingNodeId: string | null;
  selectedNodeIds: string[];
  allVisibleSelected: boolean;
  nodes: NodeDto[];
  pending: boolean;
  onCancelEdit: () => void;
  onDelete: (node: NodeDto) => void;
  onEditFormChange: (form: NodeEditFormState) => void;
  onSaveEdit: (node: NodeDto) => void;
  onStartEdit: (node: NodeDto) => void;
  onToggleEnabled: (node: NodeDto) => void;
  onToggleSelected: (nodeId: string, checked: boolean) => void;
  onToggleVisible: (checked: boolean) => void;
};

export function NodesTable({
  editForm,
  editingNodeId,
  selectedNodeIds,
  allVisibleSelected,
  nodes,
  pending,
  onCancelEdit,
  onDelete,
  onEditFormChange,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled,
  onToggleSelected,
  onToggleVisible
}: NodesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{selectionInput("选择当前列表节点", allVisibleSelected, pending || nodes.length === 0, onToggleVisible)}</TableHead>
          <TableHead>名称</TableHead>
          <TableHead>协议</TableHead>
          <TableHead>服务端</TableHead>
          <TableHead>端口</TableHead>
          <TableHead>分组</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {nodes.map((node) => {
          const editing = editingNodeId === node.id;

          return (
            <TableRow key={node.id}>
              <TableCell>
                {selectionInput(`选择节点 ${node.name}`, selectedNodeIds.includes(node.id), pending, (checked) =>
                  onToggleSelected(node.id, checked)
                )}
              </TableCell>
              <TableCell>
                {editing ? textInput("节点名称", editForm.name, pending, (name) => onEditFormChange({ ...editForm, name })) : node.name}
              </TableCell>
              <TableCell>{node.protocol}</TableCell>
              <TableCell>{node.server ?? "-"}</TableCell>
              <TableCell>{node.port ?? "-"}</TableCell>
              <TableCell>
                {editing ? (
                  textInput("节点分组", editForm.groups, pending, (groups) => onEditFormChange({ ...editForm, groups }), "香港,日本,备用")
                ) : (
                  <GroupChips groups={node.groups} />
                )}
              </TableCell>
              <TableCell>
                <StatusBadge enabled={node.enabled} />
              </TableCell>
              <TableCell>
                <NodeActions
                  editing={editing}
                  node={node}
                  pending={pending}
                  onCancelEdit={onCancelEdit}
                  onDelete={onDelete}
                  onSaveEdit={onSaveEdit}
                  onStartEdit={onStartEdit}
                  onToggleEnabled={onToggleEnabled}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function selectionInput(label: string, checked: boolean, disabled: boolean, onChange: (checked: boolean) => void) {
  return (
    <Checkbox
      aria-label={label}
      checked={checked}
      disabled={disabled}
      onCheckedChange={(value) => onChange(value === true)}
    />
  );
}

function textInput(label: string, value: string, pending: boolean, onChange: (value: string) => void, placeholder?: string) {
  return (
    <Input
      aria-label={label}
      disabled={pending}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type="text"
      value={value}
    />
  );
}

function GroupChips({ groups }: { groups: string[] }) {
  if (groups.length === 0) {
    return <span className="muted-text">未分组</span>;
  }

  return (
    <div className="group-chip-row">
      {groups.map((group) => (
        <span className="group-chip" key={group}>
          {group}
        </span>
      ))}
    </div>
  );
}

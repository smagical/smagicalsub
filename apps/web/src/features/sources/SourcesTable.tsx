import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SourceDto } from "@smagicalsub/shared";
import { StatusBadge } from "../../shared/StatusBadge";
import { SourceActions } from "./SourceActions";
import type { SourceEditFormState } from "./types";

type SourcesTableProps = {
  editForm: SourceEditFormState;
  editingSourceId: string | null;
  pending: boolean;
  sources: SourceDto[];
  onCancelEdit: () => void;
  onDelete: (source: SourceDto) => void;
  onEditFormChange: (form: SourceEditFormState) => void;
  onRefresh: (id: string) => void;
  onSaveEdit: (source: SourceDto) => void;
  onStartEdit: (source: SourceDto) => void;
  onToggleEnabled: (source: SourceDto) => void;
};

export function SourcesTable({
  editForm,
  editingSourceId,
  pending,
  sources,
  onCancelEdit,
  onDelete,
  onEditFormChange,
  onRefresh,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled
}: SourcesTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card/70 shadow-sm ring-1 ring-primary/10">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead>名称</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>刷新状态</TableHead>
            <TableHead>最近刷新</TableHead>
            <TableHead>错误</TableHead>
            <TableHead>链接</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sources.map((source) => {
            const editing = editingSourceId === source.id;

            return (
              <TableRow className="hover:bg-muted/35" key={source.id}>
                <TableCell className="font-medium">
                  {editing
                    ? sourceInput("订阅源名称", editForm.name, pending, (name) => onEditFormChange({ ...editForm, name }))
                    : source.name}
                </TableCell>
                <TableCell>
                  <StatusBadge enabled={source.enabled} />
                </TableCell>
                <TableCell>{refreshBadge(source.last_status)}</TableCell>
                <TableCell className="font-mono text-xs">{source.last_fetched_at ?? "未刷新"}</TableCell>
                <TableCell className="max-w-md truncate">{source.last_error ?? "-"}</TableCell>
                <TableCell className="max-w-md truncate font-mono text-xs">
                  {editing
                    ? sourceInput("订阅源链接", editForm.url, pending, (url) => onEditFormChange({ ...editForm, url }))
                    : source.url}
                </TableCell>
                <TableCell>
                  <SourceActions
                    editing={editing}
                    pending={pending}
                    source={source}
                    onCancelEdit={onCancelEdit}
                    onDelete={onDelete}
                    onRefresh={onRefresh}
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
    </div>
  );
}

function sourceInput(label: string, value: string, pending: boolean, onChange: (value: string) => void) {
  return (
    <Input aria-label={label} disabled={pending} onChange={(event) => onChange(event.target.value)} type="text" value={value} />
  );
}

function refreshBadge(status: string | null) {
  if (status === "success") {
    return <Badge variant="secondary">成功</Badge>;
  }

  if (status === "failed") {
    return <Badge variant="outline">失败</Badge>;
  }

  return <Badge variant="outline">未刷新</Badge>;
}

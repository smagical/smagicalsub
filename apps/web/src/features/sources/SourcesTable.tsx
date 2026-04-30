import type { SourceDto } from "@smagicalsub/shared";
import { StatusBadge } from "../../shared/StatusBadge";
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
    <table className="data-table">
      <thead>
        <tr>
          <th>名称</th>
          <th>状态</th>
          <th>刷新状态</th>
          <th>最近刷新</th>
          <th>错误</th>
          <th>链接</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {sources.map((source) => {
          const editing = editingSourceId === source.id;

          return (
            <tr key={source.id}>
              <td>{editing ? sourceInput("订阅源名称", editForm.name, pending, (name) => onEditFormChange({ ...editForm, name })) : source.name}</td>
              <td>
                <StatusBadge enabled={source.enabled} />
              </td>
              <td>{source.last_status ?? "-"}</td>
              <td>{source.last_fetched_at ?? "未刷新"}</td>
              <td className="truncate-cell">{source.last_error ?? "-"}</td>
              <td className="truncate-cell">
                {editing ? sourceInput("订阅源链接", editForm.url, pending, (url) => onEditFormChange({ ...editForm, url })) : source.url}
              </td>
              <td>
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
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function sourceInput(label: string, value: string, pending: boolean, onChange: (value: string) => void) {
  return <input aria-label={label} disabled={pending} onChange={(event) => onChange(event.target.value)} type="text" value={value} />;
}

function SourceActions({
  editing,
  pending,
  source,
  onCancelEdit,
  onDelete,
  onRefresh,
  onSaveEdit,
  onStartEdit,
  onToggleEnabled
}: {
  editing: boolean;
  pending: boolean;
  source: SourceDto;
  onCancelEdit: () => void;
  onDelete: (source: SourceDto) => void;
  onRefresh: (id: string) => void;
  onSaveEdit: (source: SourceDto) => void;
  onStartEdit: (source: SourceDto) => void;
  onToggleEnabled: (source: SourceDto) => void;
}) {
  if (editing) {
    return (
      <div className="table-actions">
        <button className="primary-button" disabled={pending} onClick={() => onSaveEdit(source)} type="button">
          保存
        </button>
        <button className="secondary-button" disabled={pending} onClick={onCancelEdit} type="button">
          取消
        </button>
      </div>
    );
  }

  return (
    <div className="table-actions">
      <button className="inline-button" disabled={pending} onClick={() => onRefresh(source.id)} type="button">
        刷新
      </button>
      <button className="secondary-button" disabled={pending} onClick={() => onStartEdit(source)} type="button">
        编辑
      </button>
      <button className="secondary-button" disabled={pending} onClick={() => onToggleEnabled(source)} type="button">
        {source.enabled ? "停用" : "启用"}
      </button>
      <button className="danger-button" disabled={pending} onClick={() => onDelete(source)} type="button">
        删除
      </button>
    </div>
  );
}

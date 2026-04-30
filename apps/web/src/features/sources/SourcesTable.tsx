import type { SourceDto } from "@smagicalsub/shared";
import { StatusBadge } from "../../shared/StatusBadge";

type SourcesTableProps = {
  pending: boolean;
  sources: SourceDto[];
  onDelete: (source: SourceDto) => void;
  onRefresh: (id: string) => void;
  onToggleEnabled: (source: SourceDto) => void;
};

export function SourcesTable({ pending, sources, onDelete, onRefresh, onToggleEnabled }: SourcesTableProps) {
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
        {sources.map((source) => (
          <tr key={source.id}>
            <td>{source.name}</td>
            <td>
              <StatusBadge enabled={source.enabled} />
            </td>
            <td>{source.last_status ?? "-"}</td>
            <td>{source.last_fetched_at ?? "未刷新"}</td>
            <td className="truncate-cell">{source.last_error ?? "-"}</td>
            <td className="truncate-cell">{source.url}</td>
            <td>
              <div className="table-actions">
                <button className="inline-button" disabled={pending} onClick={() => onRefresh(source.id)} type="button">
                  刷新
                </button>
                <button className="secondary-button" disabled={pending} onClick={() => onToggleEnabled(source)} type="button">
                  {source.enabled ? "停用" : "启用"}
                </button>
                <button className="danger-button" disabled={pending} onClick={() => onDelete(source)} type="button">
                  删除
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

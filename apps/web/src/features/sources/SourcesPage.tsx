import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../../shared/EmptyState";
import { StatusBadge } from "../../shared/StatusBadge";
import { listSources } from "./api";

export function SourcesPage() {
  const query = useQuery({
    queryKey: ["sources"],
    queryFn: listSources,
    retry: false
  });
  const sources = query.data?.items ?? [];

  return (
    <section className="panel wide">
      <ModuleHeading eyebrow="Sources" title="订阅源" description="管理上游订阅链接、刷新状态和拉取结果。" />
      {sources.length === 0 ? (
        <EmptyState label="还没有订阅源" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>状态</th>
              <th>最近刷新</th>
              <th>链接</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id}>
                <td>{source.name}</td>
                <td>
                  <StatusBadge enabled={source.enabled} />
                </td>
                <td>{source.last_fetched_at ?? "未刷新"}</td>
                <td className="truncate-cell">{source.url}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function ModuleHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="module-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <span>{description}</span>
    </div>
  );
}


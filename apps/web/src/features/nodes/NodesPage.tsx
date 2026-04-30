import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../../shared/EmptyState";
import { StatusBadge } from "../../shared/StatusBadge";
import { listNodes } from "./api";

export function NodesPage() {
  const query = useQuery({
    queryKey: ["nodes"],
    queryFn: listNodes,
    retry: false
  });
  const nodes = query.data?.items ?? [];

  return (
    <section className="panel wide">
      <div className="module-heading">
        <p className="eyebrow">Nodes</p>
        <h2>节点</h2>
        <span>查看解析后的节点协议、地址和启用状态。</span>
      </div>
      {nodes.length === 0 ? (
        <EmptyState label="还没有节点" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>协议</th>
              <th>服务端</th>
              <th>端口</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr key={node.id}>
                <td>{node.name}</td>
                <td>{node.protocol}</td>
                <td>{node.server ?? "-"}</td>
                <td>{node.port ?? "-"}</td>
                <td>
                  <StatusBadge enabled={node.enabled} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}


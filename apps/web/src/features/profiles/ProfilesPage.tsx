import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../../shared/EmptyState";
import { StatusBadge } from "../../shared/StatusBadge";
import { listProfiles } from "./api";

export function ProfilesPage() {
  const query = useQuery({
    queryKey: ["profiles"],
    queryFn: listProfiles,
    retry: false
  });
  const profiles = query.data?.items ?? [];

  return (
    <section className="panel wide">
      <div className="module-heading">
        <p className="eyebrow">Profiles</p>
        <h2>配置档</h2>
        <span>配置档用于组合节点、策略组和规则，最终生成 Clash 订阅。</span>
      </div>
      {profiles.length === 0 ? (
        <EmptyState label="还没有配置档" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>默认策略</th>
              <th>描述</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>{profile.name}</td>
                <td>{profile.default_strategy}</td>
                <td>{profile.description ?? "-"}</td>
                <td>
                  <StatusBadge enabled={profile.enabled} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}


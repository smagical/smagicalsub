import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "../../shared/EmptyState";
import { StatusBadge } from "../../shared/StatusBadge";
import { listTokens } from "./api";

export function TokensPage() {
  const query = useQuery({
    queryKey: ["tokens"],
    queryFn: listTokens,
    retry: false
  });
  const tokens = query.data?.items ?? [];

  return (
    <section className="panel wide">
      <div className="module-heading">
        <p className="eyebrow">Tokens</p>
        <h2>订阅令牌</h2>
        <span>令牌控制订阅地址访问权限，后续会接入重置、过期和限流。</span>
      </div>
      {tokens.length === 0 ? (
        <EmptyState label="还没有订阅令牌" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>令牌</th>
              <th>过期时间</th>
              <th>最近使用</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id}>
                <td>{token.name}</td>
                <td className="mono-cell">{maskToken(token.token)}</td>
                <td>{token.expires_at ?? "永不过期"}</td>
                <td>{token.last_used_at ?? "未使用"}</td>
                <td>
                  <StatusBadge enabled={token.enabled} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function maskToken(token: string) {
  if (token.length <= 12) {
    return token;
  }

  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}


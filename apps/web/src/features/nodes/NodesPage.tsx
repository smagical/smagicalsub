import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../../shared/EmptyState";
import { StatusBadge } from "../../shared/StatusBadge";
import { createNode, deleteNode, listNodeGroups, listNodes, updateNode } from "./api";

type NodeFormState = {
  uri: string;
  name: string;
  groups: string;
  enabled: boolean;
};

const initialFormState: NodeFormState = {
  uri: "",
  name: "",
  groups: "",
  enabled: true
};

export function NodesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NodeFormState>(initialFormState);
  const [groupFilter, setGroupFilter] = useState("all");
  const [notice, setNotice] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["nodes"],
    queryFn: listNodes,
    retry: false
  });
  const groupsQuery = useQuery({
    queryKey: ["node-groups"],
    queryFn: listNodeGroups,
    retry: false
  });
  const nodes = query.data?.items ?? [];
  const groups = groupsQuery.data?.groups ?? [];
  const filteredNodes = useMemo(() => {
    if (groupFilter === "all") {
      return nodes;
    }

    if (groupFilter === "ungrouped") {
      return nodes.filter((node) => node.groups.length === 0);
    }

    return nodes.filter((node) => node.groups.includes(groupFilter));
  }, [groupFilter, nodes]);

  const invalidateNodeData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["nodes"] }),
      queryClient.invalidateQueries({ queryKey: ["node-groups"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createNode,
    onSuccess: async () => {
      setForm(initialFormState);
      setNotice("节点已添加");
      await invalidateNodeData();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => updateNode(id, { enabled }),
    onSuccess: invalidateNodeData
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNode,
    onSuccess: async () => {
      setNotice("节点已删除");
      await invalidateNodeData();
    }
  });

  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const error = createMutation.error ?? updateMutation.error ?? deleteMutation.error ?? query.error;

  return (
    <section className="panel wide">
      <div className="module-heading">
        <p className="eyebrow">Nodes</p>
        <h2>节点</h2>
        <span>添加单个节点，按分组查看订阅源解析和手动维护的节点。</span>
      </div>

      <form
        className="form-grid node-form"
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate({
            uri: form.uri,
            name: form.name.trim() ? form.name : undefined,
            groups: parseGroups(form.groups),
            enabled: form.enabled
          });
        }}
      >
        <label className="wide-field">
          <span>节点链接</span>
          <input
            onChange={(event) => setForm((current) => ({ ...current, uri: event.target.value }))}
            placeholder="ss:// / vmess:// / trojan:// / vless://"
            required
            type="text"
            value={form.uri}
          />
        </label>
        <label>
          <span>显示名称</span>
          <input
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="留空使用节点名称"
            type="text"
            value={form.name}
          />
        </label>
        <label>
          <span>分组</span>
          <input
            onChange={(event) => setForm((current) => ({ ...current, groups: event.target.value }))}
            placeholder="香港,日本,备用"
            type="text"
            value={form.groups}
          />
        </label>
        <label className="checkbox-field">
          <input
            checked={form.enabled}
            onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
            type="checkbox"
          />
          <span>启用</span>
        </label>
        <button className="primary-button" disabled={pending} type="submit">
          添加节点
        </button>
      </form>

      <div className="filter-row">
        <label>
          <span>分组筛选</span>
          <select onChange={(event) => setGroupFilter(event.target.value)} value={groupFilter}>
            <option value="all">全部节点</option>
            <option value="ungrouped">未分组</option>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
      </div>

      {notice ? <p className="success-text">{notice}</p> : null}
      {error instanceof Error ? <p className="error-text">{error.message}</p> : null}

      {filteredNodes.length === 0 ? (
        <EmptyState label="还没有节点" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>协议</th>
              <th>服务端</th>
              <th>端口</th>
              <th>分组</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredNodes.map((node) => (
              <tr key={node.id}>
                <td>{node.name}</td>
                <td>{node.protocol}</td>
                <td>{node.server ?? "-"}</td>
                <td>{node.port ?? "-"}</td>
                <td>
                  <GroupChips groups={node.groups} />
                </td>
                <td>
                  <StatusBadge enabled={node.enabled} />
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      className="secondary-button"
                      disabled={pending}
                      onClick={() => updateMutation.mutate({ id: node.id, enabled: !node.enabled })}
                      type="button"
                    >
                      {node.enabled ? "停用" : "启用"}
                    </button>
                    <button
                      className="danger-button"
                      disabled={pending}
                      onClick={() => {
                        if (window.confirm(`删除节点「${node.name}」？`)) {
                          deleteMutation.mutate(node.id);
                        }
                      }}
                      type="button"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
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

function parseGroups(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((group) => group.trim())
        .filter(Boolean)
    )
  );
}

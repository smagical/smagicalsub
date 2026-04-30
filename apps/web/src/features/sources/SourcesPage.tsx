import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../../shared/EmptyState";
import { StatusBadge } from "../../shared/StatusBadge";
import { createSource, deleteSource, listSources, refreshSource, updateSource } from "./api";

type FormState = {
  name: string;
  url: string;
  enabled: boolean;
};

const initialFormState: FormState = {
  name: "",
  url: "",
  enabled: true
};

export function SourcesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [notice, setNotice] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["sources"],
    queryFn: listSources,
    retry: false
  });
  const sources = query.data?.items ?? [];

  const invalidateSourceData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sources"] }),
      queryClient.invalidateQueries({ queryKey: ["nodes"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createSource,
    onSuccess: async () => {
      setForm(initialFormState);
      setNotice("订阅源已创建");
      await invalidateSourceData();
    }
  });

  const refreshMutation = useMutation({
    mutationFn: refreshSource,
    onSuccess: async (result) => {
      setNotice(`刷新完成，解析 ${result.nodeCount} 个节点`);
      await invalidateSourceData();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => updateSource(id, { enabled }),
    onSuccess: invalidateSourceData
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSource,
    onSuccess: async () => {
      setNotice("订阅源已删除");
      await invalidateSourceData();
    }
  });

  const pending =
    createMutation.isPending || refreshMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const error =
    createMutation.error ?? refreshMutation.error ?? updateMutation.error ?? deleteMutation.error ?? query.error;

  return (
    <section className="panel wide">
      <ModuleHeading eyebrow="Sources" title="订阅源" description="管理上游订阅链接、刷新状态和拉取结果。" />

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          createMutation.mutate(form);
        }}
      >
        <label>
          <span>名称</span>
          <input
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="我的订阅"
            required
            type="text"
            value={form.name}
          />
        </label>
        <label className="wide-field">
          <span>订阅链接</span>
          <input
            onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
            placeholder="https://example.com/sub"
            required
            type="url"
            value={form.url}
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
          创建
        </button>
      </form>

      {notice ? <p className="success-text">{notice}</p> : null}
      {error instanceof Error ? <p className="error-text">{error.message}</p> : null}

      {sources.length === 0 ? (
        <EmptyState label="还没有订阅源" />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>状态</th>
              <th>刷新状态</th>
              <th>最近刷新</th>
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
                <td className="truncate-cell">{source.url}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="inline-button"
                      disabled={pending}
                      onClick={() => refreshMutation.mutate(source.id)}
                      type="button"
                    >
                      刷新
                    </button>
                    <button
                      className="secondary-button"
                      disabled={pending}
                      onClick={() => updateMutation.mutate({ id: source.id, enabled: !source.enabled })}
                      type="button"
                    >
                      {source.enabled ? "停用" : "启用"}
                    </button>
                    <button
                      className="danger-button"
                      disabled={pending}
                      onClick={() => {
                        if (window.confirm(`删除订阅源「${source.name}」？`)) {
                          deleteMutation.mutate(source.id);
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

function ModuleHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="module-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <span>{description}</span>
    </div>
  );
}

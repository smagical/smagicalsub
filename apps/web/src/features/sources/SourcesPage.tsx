import { useMemo, useState } from "react";
import type { SourceDto, UpdateSubscriptionSourceInput } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleHeading } from "../../shared/ModuleHeading";
import { createSource, deleteSource, listSources, refreshSource, updateSource } from "./api";
import { SourceForm } from "./SourceForm";
import { SourcesTable } from "./SourcesTable";
import { initialSourceEditFormState, initialSourceFormState } from "./types";

export function SourcesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialSourceFormState);
  const [editForm, setEditForm] = useState(initialSourceEditFormState);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["sources"],
    queryFn: listSources,
    retry: false
  });
  const sources = query.data?.items ?? [];
  const filteredSources = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sources.filter((source) => {
      const statusMatches =
        statusFilter === "all" ||
        (statusFilter === "enabled" && source.enabled === 1) ||
        (statusFilter === "disabled" && source.enabled !== 1) ||
        (statusFilter === "never" && !source.last_status) ||
        source.last_status === statusFilter;
      const searchMatches =
        !query ||
        [source.name, source.url, source.last_status ?? "", source.last_error ?? "", source.last_fetched_at ?? ""].some((value) =>
          value.toLowerCase().includes(query)
        );

      return statusMatches && searchMatches;
    });
  }, [searchQuery, sources, statusFilter]);

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
      setForm(initialSourceFormState);
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
    mutationFn: ({ id, input }: { id: string; input: UpdateSubscriptionSourceInput }) => updateSource(id, input),
    onSuccess: async (_source, variables) => {
      if (variables.input.name !== undefined || variables.input.url !== undefined) {
        setEditingSourceId(null);
        setEditForm(initialSourceEditFormState);
        setNotice("订阅源已更新");
      }

      await invalidateSourceData();
    }
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
  const emptyLabel = sources.length === 0 ? "还没有订阅源" : "没有匹配的订阅源";

  const startEdit = (source: SourceDto) => {
    setNotice(null);
    setEditingSourceId(source.id);
    setEditForm({ name: source.name, url: source.url });
  };

  const saveEdit = (source: SourceDto) => {
    updateMutation.mutate({
      id: source.id,
      input: {
        name: editForm.name.trim() || source.name,
        url: editForm.url.trim() || source.url
      }
    });
  };

  return (
    <section className="panel wide">
      <ModuleHeading eyebrow="Sources" title="订阅源" description="管理上游订阅链接、刷新状态和拉取结果。" />

      <SourceForm form={form} pending={pending} setForm={setForm} onSubmit={(value) => createMutation.mutate(value)} />
      <div className="filter-row">
        <label>
          <span>搜索订阅源</span>
          <input onChange={(event) => setSearchQuery(event.target.value)} placeholder="名称 / 链接 / 错误" type="search" value={searchQuery} />
        </label>
        <label>
          <span>状态筛选</span>
          <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
            <option value="all">全部订阅源</option>
            <option value="enabled">已启用</option>
            <option value="disabled">已停用</option>
            <option value="success">刷新成功</option>
            <option value="failed">刷新失败</option>
            <option value="never">未刷新</option>
          </select>
        </label>
      </div>

      {notice ? <p className="success-text">{notice}</p> : null}
      {error instanceof Error ? <p className="error-text">{error.message}</p> : null}

      {filteredSources.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <SourcesTable
          pending={pending}
          editForm={editForm}
          editingSourceId={editingSourceId}
          sources={filteredSources}
          onCancelEdit={() => {
            setEditingSourceId(null);
            setEditForm(initialSourceEditFormState);
          }}
          onDelete={(source) => {
            if (window.confirm(`删除订阅源「${source.name}」？`)) {
              deleteMutation.mutate(source.id);
            }
          }}
          onEditFormChange={setEditForm}
          onRefresh={(id) => refreshMutation.mutate(id)}
          onSaveEdit={saveEdit}
          onStartEdit={startEdit}
          onToggleEnabled={(source) => updateMutation.mutate({ id: source.id, input: { enabled: !source.enabled } })}
        />
      )}
    </section>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleHeading } from "../../shared/ModuleHeading";
import { createSource, deleteSource, listSources, refreshSource, updateSource } from "./api";
import { SourceForm } from "./SourceForm";
import { SourcesTable } from "./SourcesTable";
import { initialSourceFormState } from "./types";

export function SourcesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialSourceFormState);
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

      <SourceForm form={form} pending={pending} setForm={setForm} onSubmit={(value) => createMutation.mutate(value)} />

      {notice ? <p className="success-text">{notice}</p> : null}
      {error instanceof Error ? <p className="error-text">{error.message}</p> : null}

      {sources.length === 0 ? (
        <EmptyState label="还没有订阅源" />
      ) : (
        <SourcesTable
          pending={pending}
          sources={sources}
          onDelete={(source) => {
            if (window.confirm(`删除订阅源「${source.name}」？`)) {
              deleteMutation.mutate(source.id);
            }
          }}
          onRefresh={(id) => refreshMutation.mutate(id)}
          onToggleEnabled={(source) => updateMutation.mutate({ id: source.id, enabled: !source.enabled })}
        />
      )}
    </section>
  );
}

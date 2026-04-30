import { useMemo, useState } from "react";
import type { SourceDto, UpdateSubscriptionSourceInput } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSource, deleteSource, listSources, refreshAllSources, refreshSource, updateSource } from "./api";
import { initialSourceEditFormState, initialSourceFormState } from "./types";

export function useSourcesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialSourceFormState);
  const [editForm, setEditForm] = useState(initialSourceEditFormState);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [notice, setNotice] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["sources"], queryFn: listSources, retry: false });
  const sources = query.data?.items ?? [];
  const filteredSources = useMemo(() => filterSources(sources, searchQuery, statusFilter), [searchQuery, sources, statusFilter]);

  const invalidateSourceData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sources"] }),
      queryClient.invalidateQueries({ queryKey: ["nodes"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    ]);
  };

  const resetEdit = () => {
    setEditingSourceId(null);
    setEditForm(initialSourceEditFormState);
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

  const refreshAllMutation = useMutation({
    mutationFn: refreshAllSources,
    onSuccess: async (result) => {
      setNotice(`批量刷新完成：成功 ${result.success} 个，失败 ${result.failed} 个，解析 ${result.nodeCount} 个节点`);
      await invalidateSourceData();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubscriptionSourceInput }) => updateSource(id, input),
    onSuccess: async (_source, variables) => {
      if (variables.input.name !== undefined || variables.input.url !== undefined) {
        resetEdit();
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

  const pending = createMutation.isPending || refreshMutation.isPending || refreshAllMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const error =
    createMutation.error ?? refreshMutation.error ?? refreshAllMutation.error ?? updateMutation.error ?? deleteMutation.error ?? query.error;
  const emptyLabel = sources.length === 0 ? "还没有订阅源" : "没有匹配的订阅源";

  const startEdit = (source: SourceDto) => {
    setNotice(null);
    setEditingSourceId(source.id);
    setEditForm({ name: source.name, url: source.url });
  };

  const saveEdit = (source: SourceDto) => {
    updateMutation.mutate({
      id: source.id,
      input: { name: editForm.name.trim() || source.name, url: editForm.url.trim() || source.url }
    });
  };

  return {
    editForm,
    editingSourceId,
    emptyLabel,
    error,
    filteredSources,
    form,
    notice,
    pending,
    searchQuery,
    sourceCount: sources.length,
    statusFilter,
    createSource: createMutation.mutate,
    deleteSource: (source: SourceDto) => {
      if (window.confirm(`删除订阅源「${source.name}」？`)) {
        deleteMutation.mutate(source.id);
      }
    },
    refreshAll: () => refreshAllMutation.mutate(),
    refreshSource: (id: string) => refreshMutation.mutate(id),
    resetEdit,
    saveEdit,
    setEditForm,
    setForm,
    setSearchQuery,
    setStatusFilter,
    startEdit,
    toggleEnabled: (source: SourceDto) => updateMutation.mutate({ id: source.id, input: { enabled: !source.enabled } })
  };
}

function filterSources(sources: SourceDto[], searchQuery: string, statusFilter: string) {
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
}

import { useEffect, useMemo, useState } from "react";
import type { SourceDto, UpdateSubscriptionSourceInput } from "@smagicalsub/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSource, deleteSource, listSources, refreshAllSources, refreshSource, updateSource } from "./api";
import { initialSourceEditFormState, initialSourceFormState } from "./types";
import { filterSources } from "./utils";

const sourcePageSizeOptions = [10, 20, 30, 40, 50, 70, 100] as const;
const defaultSourcePageSize = sourcePageSizeOptions[0];

export function useSourcesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialSourceFormState);
  const [editForm, setEditForm] = useState(initialSourceEditFormState);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(defaultSourcePageSize);
  const [notice, setNotice] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["sources"], queryFn: listSources, retry: false });
  const sources = query.data?.items ?? [];
  const groups = useMemo(
    () => Array.from(new Set(sources.flatMap((source) => source.groups))).sort((a, b) => a.localeCompare(b)),
    [sources]
  );
  const filteredSources = useMemo(() => filterSources(sources, searchQuery, statusFilter), [searchQuery, sources, statusFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredSources.length / pageSize));
  const paginatedSources = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredSources.slice(start, start + pageSize);
  }, [currentPage, filteredSources, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    setCurrentPage((current) => Math.min(Math.max(current, 1), pageCount));
  }, [pageCount]);

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
      if (
        variables.input.name !== undefined ||
        variables.input.url !== undefined ||
        variables.input.groups !== undefined ||
        variables.input.refresh_interval_minutes !== undefined
      ) {
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
    setEditForm({
      groups: [...source.groups],
      name: source.name,
      refresh_interval_minutes: String(source.refresh_interval_minutes ?? 0),
      url: source.url
    });
  };

  const saveEdit = (source: SourceDto) => {
    updateMutation.mutate({
      id: source.id,
      input: {
        groups: editForm.groups,
        name: editForm.name.trim() || source.name,
        refresh_interval_minutes: Number(editForm.refresh_interval_minutes) || 0,
        url: editForm.url.trim() || source.url
      }
    });
  };

  const changePageSize = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  return {
    currentPage,
    editForm,
    editingSourceId,
    emptyLabel,
    error,
    filteredSources,
    form,
    groups,
    notice,
    pageCount,
    pageSize,
    pageSizeOptions: sourcePageSizeOptions,
    paginatedSources,
    pending,
    searchQuery,
    sourceCount: sources.length,
    statusFilter,
    createSource: createMutation.mutate,
    deleteSource: (source: SourceDto) => deleteMutation.mutate(source.id),
    refreshAll: () => refreshAllMutation.mutate(),
    refreshSource: (id: string) => refreshMutation.mutate(id),
    resetEdit,
    saveEdit,
    setCurrentPage,
    setEditForm,
    setForm,
    setPageSize: changePageSize,
    setSearchQuery,
    setStatusFilter,
    startEdit,
    toggleEnabled: (source: SourceDto) => updateMutation.mutate({ id: source.id, input: { enabled: !source.enabled } })
  };
}

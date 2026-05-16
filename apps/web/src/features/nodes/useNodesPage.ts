import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NodeBatchActionInput, NodeDto, UpdateNodeInput } from "@smagicalsub/shared";
import { batchNodes, createNode, deleteNode, listNodeGroups, listNodes, updateNode } from "./api";
import { initialNodeBatchFormState, initialNodeEditFormState, initialNodeFormState } from "./types";
import { filterNodes, nodeProtocols, splitNodeGroups, toggleSelectedId, toggleVisibleSelection } from "./utils";

const nodePageSizeOptions = [10, 20, 30, 40, 50, 70, 100] as const;
const defaultNodePageSize = nodePageSizeOptions[0];

export function useNodesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialNodeFormState);
  const [editForm, setEditForm] = useState(initialNodeEditFormState);
  const [batchForm, setBatchForm] = useState(initialNodeBatchFormState);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [groupFilters, setGroupFilters] = useState<string[]>([]);
  const [includeUngrouped, setIncludeUngrouped] = useState(false);
  const [protocolFilter, setProtocolFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(defaultNodePageSize);
  const [notice, setNotice] = useState<{ id: number; message: string } | null>(null);
  const noticeIdRef = useRef(0);
  const query = useQuery({ queryKey: ["nodes"], queryFn: listNodes, retry: false });
  const groupsQuery = useQuery({ queryKey: ["node-groups"], queryFn: listNodeGroups, retry: false });
  const nodes = query.data?.items ?? [];
  const groups = useMemo(
    () => splitNodeGroups(groupsQuery.data?.groups ?? []).sort((a, b) => a.localeCompare(b)),
    [groupsQuery.data?.groups]
  );
  const protocols = useMemo(() => nodeProtocols(nodes), [nodes]);
  const filteredNodes = useMemo(
    () => filterNodes(nodes, groupFilters, includeUngrouped, protocolFilter, searchQuery),
    [groupFilters, includeUngrouped, nodes, protocolFilter, searchQuery]
  );
  const pageCount = Math.max(1, Math.ceil(filteredNodes.length / pageSize));
  const paginatedNodes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;

    return filteredNodes.slice(start, start + pageSize);
  }, [currentPage, filteredNodes, pageSize]);
  const visibleNodeIds = useMemo(() => paginatedNodes.map((node) => node.id), [paginatedNodes]);
  const allVisibleSelected = visibleNodeIds.length > 0 && visibleNodeIds.every((id) => selectedNodeIds.includes(id));

  useEffect(() => {
    setCurrentPage(1);
  }, [groupFilters, includeUngrouped, protocolFilter, searchQuery]);

  useEffect(() => {
    setCurrentPage((current) => Math.min(Math.max(current, 1), pageCount));
  }, [pageCount]);

  const invalidateNodeData = async () => {
    await Promise.all(
      ["nodes", "node-groups", "dashboard"].map((queryKey) => queryClient.invalidateQueries({ queryKey: [queryKey] }))
    );
  };

  const resetEdit = () => {
    setEditingNodeId(null);
    setEditForm(initialNodeEditFormState);
  };

  const createMutation = useMutation({
    mutationFn: createNode,
    onSuccess: async () => {
      setForm(initialNodeFormState);
      pushNotice("节点已添加");
      await invalidateNodeData();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNodeInput }) => updateNode(id, input),
    onSuccess: async (_node, variables) => {
      if (isFormEditInput(variables.input)) {
        resetEdit();
        pushNotice("节点已更新");
      }

      await invalidateNodeData();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNode,
    onSuccess: async () => {
      pushNotice("节点已删除");
      await invalidateNodeData();
    }
  });

  const batchMutation = useMutation({
    mutationFn: batchNodes,
    onSuccess: async (result) => {
      setBatchForm(initialNodeBatchFormState);
      setSelectedNodeIds([]);
      pushNotice(`批量操作完成，影响 ${result.affected} 个节点`);
      await invalidateNodeData();
    }
  });

  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || batchMutation.isPending;
  const error = createMutation.error ?? updateMutation.error ?? deleteMutation.error ?? batchMutation.error ?? query.error;
  const emptyLabel = nodes.length === 0 ? "还没有节点" : "没有匹配的节点";

  const startEdit = (node: NodeDto) => {
    clearNotice();
    setEditingNodeId(node.id);
    setEditForm({
      name: node.name,
      groups: splitNodeGroups(node.groups),
      uri: node.uri ?? "",
      enabled: Boolean(node.enabled),
      configJson: JSON.stringify(node.config ?? {}, null, 2)
    });
  };

  const saveEdit = (node: NodeDto) => {
    const config = parseConfigJson(editForm.configJson);

    if (!config.ok) {
      pushNotice(config.message);
      return;
    }

    updateMutation.mutate({
      id: node.id,
      input: {
        name: editForm.name.trim() || node.name,
        groups: editForm.groups,
        uri: editForm.uri.trim() && editForm.uri.trim() !== (node.uri ?? "") ? editForm.uri.trim() : undefined,
        enabled: editForm.enabled,
        config: config.value
      }
    });
  };

  const runBatchAction = (action: NodeBatchActionInput["action"]) => {
    if (selectedNodeIds.length === 0) {
      return;
    }

    const groups = batchForm.groups;
    if (action === "append-groups" && groups.length === 0) {
      pushNotice("请输入要追加的分组");
      return;
    }

    batchMutation.mutate({ ids: selectedNodeIds, action, groups: action.endsWith("-groups") ? groups : undefined });
  };

  const copyNode = async (node: NodeDto, value?: string) => {
    if (!navigator.clipboard) {
      pushNotice("当前浏览器不支持自动复制，请手动复制节点内容");
      return;
    }

    // 优先复制原始节点链接；手动 JSON 节点没有链接时退回复制结构化配置。
    await navigator.clipboard.writeText(value ?? node.uri ?? JSON.stringify(node.config ?? {}, null, 2));
    pushNotice("节点内容已复制");
  };

  // 列表选择状态依赖当前筛选结果，因此统一从 hook 暴露，避免页面重复拼装。
  const toggleSelected = (nodeId: string, checked: boolean) => {
    setSelectedNodeIds((current) => toggleSelectedId(current, nodeId, checked));
  };
  const toggleVisible = (checked: boolean) => {
    setSelectedNodeIds((current) => toggleVisibleSelection(current, visibleNodeIds, checked));
  };

  const changePageSize = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  return {
    allVisibleSelected,
    batchGroups: batchForm.groups,
    currentPage,
    editForm,
    editingNodeId,
    emptyLabel,
    error,
    filteredNodes,
    form,
    groupFilters,
    groups,
    includeUngrouped,
    nodes,
    notice,
    pageCount,
    pageSize,
    pageSizeOptions: nodePageSizeOptions,
    paginatedNodes,
    pending,
    protocolFilter,
    protocols,
    searchQuery,
    selectedNodeIds,
    createNode: createMutation.mutate,
    copyNode,
    deleteNode: (node: NodeDto) => deleteMutation.mutate(node.id),
    resetEdit,
    runBatchAction,
    saveEdit,
    setBatchGroups: (value: string[]) => setBatchForm({ groups: value }),
    setCurrentPage,
    setEditForm,
    setForm,
    setGroupFilters,
    setIncludeUngrouped,
    setPageSize: changePageSize,
    setProtocolFilter,
    setSearchQuery,
    startEdit,
    toggleEnabled: (node: NodeDto) => updateMutation.mutate({ id: node.id, input: { enabled: !node.enabled } }),
    toggleSelected,
    toggleVisible,
    clearGroupFilters: () => {
      setGroupFilters([]);
      setIncludeUngrouped(false);
    },
    clearSelection: () => setSelectedNodeIds([])
  };

  function pushNotice(message: string) {
    noticeIdRef.current += 1;
    setNotice({ id: noticeIdRef.current, message });
  }

  function clearNotice() {
    setNotice(null);
  }
}

function isFormEditInput(input: UpdateNodeInput) {
  return input.name !== undefined || input.groups !== undefined || input.uri !== undefined || input.config !== undefined;
}

function parseConfigJson(value: string): { ok: true; value: Record<string, unknown> } | { ok: false; message: string } {
  try {
    const parsed = JSON.parse(value || "{}") as unknown;

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { ok: true, value: parsed as Record<string, unknown> };
    }
  } catch {
    return { ok: false, message: "高级参数不是合法 JSON" };
  }

  return { ok: false, message: "高级参数必须是 JSON 对象" };
}

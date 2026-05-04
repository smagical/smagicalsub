import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NodeBatchActionInput, NodeDto, UpdateNodeInput } from "@smagicalsub/shared";
import { batchNodes, createNode, deleteNode, listNodeGroups, listNodes, updateNode } from "./api";
import { initialNodeBatchFormState, initialNodeEditFormState, initialNodeFormState } from "./types";
import { filterNodes, formatGroups, nodeProtocols, parseGroups, toggleSelectedId, toggleVisibleSelection } from "./utils";

export function useNodesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialNodeFormState);
  const [editForm, setEditForm] = useState(initialNodeEditFormState);
  const [batchForm, setBatchForm] = useState(initialNodeBatchFormState);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState("all");
  const [protocolFilter, setProtocolFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const query = useQuery({ queryKey: ["nodes"], queryFn: listNodes, retry: false });
  const groupsQuery = useQuery({ queryKey: ["node-groups"], queryFn: listNodeGroups, retry: false });
  const nodes = query.data?.items ?? [];
  const groups = groupsQuery.data?.groups ?? [];
  const protocols = useMemo(() => nodeProtocols(nodes), [nodes]);
  const filteredNodes = useMemo(() => filterNodes(nodes, groupFilter, protocolFilter, searchQuery), [groupFilter, nodes, protocolFilter, searchQuery]);
  const visibleNodeIds = useMemo(() => filteredNodes.map((node) => node.id), [filteredNodes]);
  const allVisibleSelected = visibleNodeIds.length > 0 && visibleNodeIds.every((id) => selectedNodeIds.includes(id));

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
      setNotice("节点已添加");
      await invalidateNodeData();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNodeInput }) => updateNode(id, input),
    onSuccess: async (_node, variables) => {
      if (variables.input.name !== undefined || variables.input.groups !== undefined) {
        resetEdit();
        setNotice("节点已更新");
      }

      await invalidateNodeData();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNode,
    onSuccess: async () => {
      setNotice("节点已删除");
      await invalidateNodeData();
    }
  });

  const batchMutation = useMutation({
    mutationFn: batchNodes,
    onSuccess: async (result) => {
      setBatchForm(initialNodeBatchFormState);
      setSelectedNodeIds([]);
      setNotice(`批量操作完成，影响 ${result.affected} 个节点`);
      await invalidateNodeData();
    }
  });

  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || batchMutation.isPending;
  const error = createMutation.error ?? updateMutation.error ?? deleteMutation.error ?? batchMutation.error ?? query.error;
  const emptyLabel = nodes.length === 0 ? "还没有节点" : "没有匹配的节点";

  const startEdit = (node: NodeDto) => {
    setNotice(null);
    setEditingNodeId(node.id);
    setEditForm({ name: node.name, groups: formatGroups(node.groups) });
  };

  const saveEdit = (node: NodeDto) => {
    updateMutation.mutate({
      id: node.id,
      input: { name: editForm.name.trim() || node.name, groups: parseGroups(editForm.groups) }
    });
  };

  const runBatchAction = (action: NodeBatchActionInput["action"]) => {
    if (selectedNodeIds.length === 0) {
      return;
    }

    const groups = parseGroups(batchForm.groups);
    if (action === "append-groups" && groups.length === 0) {
      setNotice("请输入要追加的分组");
      return;
    }

    batchMutation.mutate({ ids: selectedNodeIds, action, groups: action.endsWith("-groups") ? groups : undefined });
  };

  // 表格选择状态依赖当前筛选结果，因此统一从 hook 暴露，避免页面重复拼装。
  const toggleSelected = (nodeId: string, checked: boolean) => {
    setSelectedNodeIds((current) => toggleSelectedId(current, nodeId, checked));
  };
  const toggleVisible = (checked: boolean) => {
    setSelectedNodeIds((current) => toggleVisibleSelection(current, visibleNodeIds, checked));
  };

  return {
    allVisibleSelected,
    batchGroups: batchForm.groups,
    editForm,
    editingNodeId,
    emptyLabel,
    error,
    filteredNodes,
    form,
    groupFilter,
    groups,
    notice,
    pending,
    protocolFilter,
    protocols,
    searchQuery,
    selectedNodeIds,
    createNode: createMutation.mutate,
    deleteNode: (node: NodeDto) => deleteMutation.mutate(node.id),
    resetEdit,
    runBatchAction,
    saveEdit,
    setBatchGroups: (value: string) => setBatchForm({ groups: value }),
    setEditForm,
    setForm,
    setGroupFilter,
    setProtocolFilter,
    setSearchQuery,
    startEdit,
    toggleEnabled: (node: NodeDto) => updateMutation.mutate({ id: node.id, input: { enabled: !node.enabled } }),
    toggleSelected,
    toggleVisible,
    clearSelection: () => setSelectedNodeIds([])
  };
}

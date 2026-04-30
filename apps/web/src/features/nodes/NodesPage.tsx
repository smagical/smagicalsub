import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NodeBatchActionInput, NodeDto, UpdateNodeInput } from "@smagicalsub/shared";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleHeading } from "../../shared/ModuleHeading";
import { batchNodes, createNode, deleteNode, listNodeGroups, listNodes, updateNode } from "./api";
import { NodeBatchBar, NodeFilters } from "./NodeFilters";
import { NodeForm } from "./NodeForm";
import { NodesTable } from "./NodesTable";
import { initialNodeBatchFormState, initialNodeEditFormState, initialNodeFormState } from "./types";
import { filterNodes, formatGroups, parseGroups, toggleSelectedId, toggleVisibleSelection } from "./utils";

export function NodesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialNodeFormState);
  const [editForm, setEditForm] = useState(initialNodeEditFormState);
  const [batchForm, setBatchForm] = useState(initialNodeBatchFormState);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [groupFilter, setGroupFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
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
  const filteredNodes = useMemo(() => filterNodes(nodes, groupFilter, searchQuery), [groupFilter, nodes, searchQuery]);
  const visibleNodeIds = useMemo(() => filteredNodes.map((node) => node.id), [filteredNodes]);
  const allVisibleSelected = visibleNodeIds.length > 0 && visibleNodeIds.every((id) => selectedNodeIds.includes(id));

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
      setForm(initialNodeFormState);
      setNotice("节点已添加");
      await invalidateNodeData();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNodeInput }) => updateNode(id, input),
    onSuccess: async (_node, variables) => {
      if (variables.input.name !== undefined || variables.input.groups !== undefined) {
        setEditingNodeId(null);
        setEditForm(initialNodeEditFormState);
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

    if (action === "delete" && !window.confirm(`删除选中的 ${selectedNodeIds.length} 个节点？`)) {
      return;
    }

    const groups = parseGroups(batchForm.groups);
    if (action === "append-groups" && groups.length === 0) {
      setNotice("请输入要追加的分组");
      return;
    }

    batchMutation.mutate({ ids: selectedNodeIds, action, groups: action.endsWith("-groups") ? groups : undefined });
  };

  return (
    <section className="panel wide">
      <ModuleHeading eyebrow="Nodes" title="节点" description="添加单个节点，按分组查看订阅源解析和手动维护的节点。" />

      <NodeForm form={form} pending={pending} setForm={setForm} onSubmit={(value) => createMutation.mutate(value)} />
      <NodeFilters
        groups={groups}
        groupFilter={groupFilter}
        searchQuery={searchQuery}
        onGroupFilterChange={setGroupFilter}
        onSearchQueryChange={setSearchQuery}
      />
      <NodeBatchBar
        batchGroups={batchForm.groups}
        pending={pending}
        selectedCount={selectedNodeIds.length}
        onAction={runBatchAction}
        onBatchGroupsChange={(value) => setBatchForm({ groups: value })}
        onClearSelection={() => setSelectedNodeIds([])}
      />

      {notice ? <p className="success-text">{notice}</p> : null}
      {error instanceof Error ? <p className="error-text">{error.message}</p> : null}

      {filteredNodes.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <NodesTable
          allVisibleSelected={allVisibleSelected}
          editForm={editForm}
          editingNodeId={editingNodeId}
          nodes={filteredNodes}
          pending={pending}
          selectedNodeIds={selectedNodeIds}
          onCancelEdit={() => {
            setEditingNodeId(null);
            setEditForm(initialNodeEditFormState);
          }}
          onDelete={(node) => {
            if (window.confirm(`删除节点「${node.name}」？`)) {
              deleteMutation.mutate(node.id);
            }
          }}
          onEditFormChange={setEditForm}
          onSaveEdit={saveEdit}
          onStartEdit={startEdit}
          onToggleEnabled={(node) => updateMutation.mutate({ id: node.id, input: { enabled: !node.enabled } })}
          onToggleSelected={(nodeId, checked) => setSelectedNodeIds((current) => toggleSelectedId(current, nodeId, checked))}
          onToggleVisible={(checked) => setSelectedNodeIds((current) => toggleVisibleSelection(current, visibleNodeIds, checked))}
        />
      )}
    </section>
  );
}

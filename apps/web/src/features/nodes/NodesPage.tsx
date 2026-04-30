import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NodeDto, UpdateNodeInput } from "@smagicalsub/shared";
import { EmptyState } from "../../shared/EmptyState";
import { ModuleHeading } from "../../shared/ModuleHeading";
import { createNode, deleteNode, listNodeGroups, listNodes, updateNode } from "./api";
import { NodeFilters } from "./NodeFilters";
import { NodeForm } from "./NodeForm";
import { NodesTable } from "./NodesTable";
import { initialNodeEditFormState, initialNodeFormState } from "./types";
import { formatGroups, parseGroups } from "./utils";

export function NodesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialNodeFormState);
  const [editForm, setEditForm] = useState(initialNodeEditFormState);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
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

  const pending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const error = createMutation.error ?? updateMutation.error ?? deleteMutation.error ?? query.error;

  const startEdit = (node: NodeDto) => {
    setNotice(null);
    setEditingNodeId(node.id);
    setEditForm({
      name: node.name,
      groups: formatGroups(node.groups)
    });
  };

  const saveEdit = (node: NodeDto) => {
    updateMutation.mutate({
      id: node.id,
      input: {
        name: editForm.name.trim() || node.name,
        groups: parseGroups(editForm.groups)
      }
    });
  };

  return (
    <section className="panel wide">
      <ModuleHeading eyebrow="Nodes" title="节点" description="添加单个节点，按分组查看订阅源解析和手动维护的节点。" />

      <NodeForm form={form} pending={pending} setForm={setForm} onSubmit={(value) => createMutation.mutate(value)} />
      <NodeFilters groups={groups} groupFilter={groupFilter} onGroupFilterChange={setGroupFilter} />

      {notice ? <p className="success-text">{notice}</p> : null}
      {error instanceof Error ? <p className="error-text">{error.message}</p> : null}

      {filteredNodes.length === 0 ? (
        <EmptyState label="还没有节点" />
      ) : (
        <NodesTable
          editForm={editForm}
          editingNodeId={editingNodeId}
          nodes={filteredNodes}
          pending={pending}
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
        />
      )}
    </section>
  );
}

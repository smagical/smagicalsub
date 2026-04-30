import type { CreateNodeInput, ListDto, NodeDto, UpdateNodeInput } from "@smagicalsub/shared";
import { deleteJson, getJson, patchJson, postJson } from "../../lib/api-client";

export function listNodes() {
  return getJson<ListDto<NodeDto>>("/api/nodes");
}

export function listNodeGroups() {
  return getJson<{ groups: string[] }>("/api/nodes/groups");
}

export function createNode(input: CreateNodeInput) {
  return postJson<NodeDto>("/api/nodes", input);
}

export function updateNode(id: string, input: UpdateNodeInput) {
  return patchJson<NodeDto>(`/api/nodes/${id}`, input);
}

export function deleteNode(id: string) {
  return deleteJson<{ id: string }>(`/api/nodes/${id}`);
}

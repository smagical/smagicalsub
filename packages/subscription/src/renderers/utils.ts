import type { RenderableNode } from "./types";

export const defaultGroupName = "默认";

export function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function renderGroupName(group: string) {
  return `Group: ${group}`;
}

export function getNodeConfig(node: RenderableNode) {
  return JSON.parse(node.config_json) as Record<string, unknown>;
}

// Internal metadata is persisted for subscription formats, but must not leak into client configs.
export function stripInternalFields(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !key.startsWith("__")));
}

export function getRawUri(node: RenderableNode) {
  try {
    const parsed = getNodeConfig(node);
    return typeof parsed.__rawUri === "string" ? parsed.__rawUri : null;
  } catch {
    return null;
  }
}

export function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== "")
  ) as T;
}

export function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

import type { ListDto, NodeDto } from "@smagicalsub/shared";
import { getJson } from "../../lib/api-client";

export function listNodes() {
  return getJson<ListDto<NodeDto>>("/api/nodes");
}


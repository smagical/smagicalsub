import type { ListDto, SourceDto } from "@smagicalsub/shared";
import { getJson } from "../../lib/api-client";

export function listSources() {
  return getJson<ListDto<SourceDto>>("/api/sources");
}


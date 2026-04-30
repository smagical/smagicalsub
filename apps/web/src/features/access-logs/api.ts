import type { AccessLogDto, ListDto } from "@smagicalsub/shared";
import { getJson } from "../../lib/api-client";

export function listAccessLogs() {
  return getJson<ListDto<AccessLogDto>>("/api/logs");
}

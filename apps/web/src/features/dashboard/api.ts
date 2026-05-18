import type { DashboardDto } from "@smagicalsub/shared";
import { getJson } from "../../lib/api-client";

export function getDashboard() {
  return getJson<DashboardDto>("/api/dashboard");
}


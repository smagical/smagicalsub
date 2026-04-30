import type { ListDto, SubscribeTokenDto } from "@smagicalsub/shared";
import { getJson } from "../../lib/api-client";

export function listTokens() {
  return getJson<ListDto<SubscribeTokenDto>>("/api/tokens");
}


import type { ProfileDto, SubscribeTokenDto } from "@smagicalsub/shared";
import { useQuery } from "@tanstack/react-query";
import { listNodes } from "../nodes/api";
import { listProfileRules } from "../profiles/api";

export type TokenOutputDiagnostics = {
  enabledNodeCount: number;
  enabledRuleCount: number;
  groupCount: number;
  manualNodeCount: number;
  profileAvailable: boolean;
  profileName: string;
  sourceNodeCount: number;
  warnings: string[];
};

export function useTokenOutputDiagnostics(token: SubscribeTokenDto | null, profiles: ProfileDto[]) {
  const nodesQuery = useQuery({ queryKey: ["nodes"], queryFn: listNodes, retry: false });
  const rulesQuery = useQuery({
    queryKey: ["profile-rules", token?.profile_id],
    queryFn: () => listProfileRules(token?.profile_id ?? ""),
    enabled: Boolean(token?.profile_id),
    retry: false
  });
  const nodes = nodesQuery.data?.items ?? [];
  const rules = rulesQuery.data?.items ?? [];
  const profile = token?.profile_id ? profiles.find((item) => item.id === token.profile_id) ?? null : null;
  const enabledNodes = nodes.filter((node) => Boolean(node.enabled));
  const enabledRules = rules.filter((rule) => Boolean(rule.enabled));
  const profileAvailable = !token?.profile_id || Boolean(profile?.enabled);
  const warnings = outputWarnings(token, profileAvailable, enabledNodes.length, enabledRules.length);

  return {
    diagnostics: {
      enabledNodeCount: enabledNodes.length,
      enabledRuleCount: enabledRules.length,
      groupCount: new Set(enabledNodes.flatMap((node) => node.groups)).size,
      manualNodeCount: enabledNodes.filter((node) => !node.source_id).length,
      profileAvailable,
      profileName: profile?.name ?? token?.profile_name ?? "未绑定",
      sourceNodeCount: enabledNodes.filter((node) => node.source_id).length,
      warnings
    },
    diagnosticsError: nodesQuery.error ?? rulesQuery.error
  };
}

function outputWarnings(token: SubscribeTokenDto | null, profileAvailable: boolean, nodeCount: number, ruleCount: number) {
  const warnings: string[] = [];

  if (token && !Boolean(token.enabled)) {
    warnings.push("令牌已停用，订阅请求会被拒绝");
  }

  if (!profileAvailable) {
    warnings.push("绑定配置档不可用，订阅请求会返回 404");
  }

  if (nodeCount === 0) {
    warnings.push("没有启用节点，订阅内容会为空");
  }

  if (token?.profile_id && ruleCount === 0) {
    warnings.push("绑定配置档没有启用规则，将只输出默认策略");
  }

  return warnings;
}

import type { RenderSubscriptionBaseInput, RenderableNode } from "./types";
import { toSingBoxOutbound } from "./sing-box-outbound";
import { createPolicyContext, policyUsesBlock, renderSingBoxRouteRules } from "./rules";
import { defaultGroupName, renderGroupName, uniqueStrings } from "./utils";

export function renderSingBoxConfig(input: RenderSubscriptionBaseInput): string {
  // 输出保持最小可运行：mixed inbound、主 selector、分组 selector、节点 outbound 和 direct。
  const primarySelector = input.defaultStrategy ?? "Proxy";
  const outbounds = input.nodes
    .map(toSingBoxOutbound)
    .filter((outbound): outbound is Record<string, unknown> => outbound !== null);
  const outboundTags = outbounds.map((outbound) => String(outbound.tag));
  const grouped = buildSingBoxSelectors(input.nodes, outboundTags);
  const policyContext = createPolicyContext(input.nodes, outboundTags, primarySelector);
  const routeRules = renderSingBoxRouteRules(input.rules ?? [], policyContext);
  const needsBlockOutbound = policyUsesBlock(input.rules ?? []);

  const config = {
    log: {
      level: "info"
    },
    inbounds: [
      {
        type: "mixed",
        tag: "mixed-in",
        listen: "127.0.0.1",
        listen_port: 2080
      }
    ],
    outbounds: [
      createSingBoxSelector(primarySelector, grouped.main.length > 0 ? grouped.main : ["direct"]),
      ...grouped.groups,
      ...outbounds,
      {
        type: "direct",
        tag: "direct"
      },
      ...(needsBlockOutbound ? [{ type: "block", tag: "block" }] : [])
    ],
    route: {
      rules: routeRules,
      final: primarySelector
    }
  };

  return `${JSON.stringify(config, null, 2)}\n`;
}

// sing-box selector 复用 Clash 的分组模型：空分组节点统一归入“默认”。
function buildSingBoxSelectors(nodes: RenderableNode[], outboundTags: string[]) {
  const groups = new Map<string, string[]>();
  const tagSet = new Set(outboundTags);

  for (const node of nodes) {
    if (!tagSet.has(node.name)) {
      continue;
    }

    const nodeGroups = uniqueStrings(node.groups ?? []);
    const effectiveGroups = nodeGroups.length > 0 ? nodeGroups : [defaultGroupName];

    for (const group of effectiveGroups) {
      groups.set(group, [...(groups.get(group) ?? []), node.name]);
    }
  }

  const groupNames = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
  const renderedGroupNames = groupNames.map(renderGroupName);

  return {
    main: renderedGroupNames,
    groups: groupNames.map((groupName) =>
      createSingBoxSelector(renderGroupName(groupName), uniqueStrings(groups.get(groupName) ?? []))
    )
  };
}

function createSingBoxSelector(tag: string, outbounds: string[]) {
  // 空分组回退到 direct，保证生成的 sing-box JSON 始终可启动。
  return {
    type: "selector",
    tag,
    outbounds: outbounds.length > 0 ? outbounds : ["direct"]
  };
}

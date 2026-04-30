import type { RenderSubscriptionBaseInput, RenderableNode } from "./types";
import { toSingBoxOutbound } from "./sing-box-outbound";
import { renderGroupName, uniqueStrings } from "./utils";

export function renderSingBoxConfig(input: RenderSubscriptionBaseInput): string {
  // 输出保持最小可运行：mixed inbound、主 selector、分组 selector、节点 outbound 和 direct。
  const primarySelector = input.defaultStrategy ?? "Proxy";
  const outbounds = input.nodes
    .map(toSingBoxOutbound)
    .filter((outbound): outbound is Record<string, unknown> => outbound !== null);
  const outboundTags = outbounds.map((outbound) => String(outbound.tag));
  const grouped = buildSingBoxSelectors(input.nodes, outboundTags);

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
      }
    ],
    route: {
      final: primarySelector
    }
  };

  return `${JSON.stringify(config, null, 2)}\n`;
}

// sing-box selector 复用 Clash 的分组模型：主选择器先放分组，再放未分组节点。
function buildSingBoxSelectors(nodes: RenderableNode[], outboundTags: string[]) {
  const groups = new Map<string, string[]>();
  const ungrouped: string[] = [];
  const tagSet = new Set(outboundTags);

  for (const node of nodes) {
    if (!tagSet.has(node.name)) {
      continue;
    }

    const nodeGroups = uniqueStrings(node.groups ?? []);

    if (nodeGroups.length === 0) {
      ungrouped.push(node.name);
      continue;
    }

    for (const group of nodeGroups) {
      groups.set(group, [...(groups.get(group) ?? []), node.name]);
    }
  }

  const groupNames = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
  const renderedGroupNames = groupNames.map(renderGroupName);

  return {
    main: renderedGroupNames.length > 0 ? [...renderedGroupNames, ...uniqueStrings(ungrouped)] : uniqueStrings(ungrouped),
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

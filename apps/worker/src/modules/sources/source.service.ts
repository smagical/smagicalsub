import { parseSubscription } from "@smagicalsub/subscription";
import type { SourceRefreshAllDto, SourceRefreshDto } from "@smagicalsub/shared";
import type { Env } from "../../env";
import { replaceSourceNodes } from "./source-node.repository";
import {
  createRefreshJob,
  markRefreshJobFinished,
  markSourceRefreshStatus
} from "./source-refresh.repository";
import { findSourceById, listEnabledSourceIds } from "./source.repository";

const sourceRawKeyPrefix = "source_raw";

export async function refreshSource(env: Env, sourceId: string): Promise<SourceRefreshDto | null> {
  const source = await findSourceById(env.DB, sourceId);

  if (!source) {
    return null;
  }

  // 刷新是可审计操作：先创建 job，再更新 source 状态，失败也能保留原因。
  const jobId = await createRefreshJob(env.DB, sourceId);

  try {
    const response = await fetch(source.url, {
      headers: {
        Accept: "text/plain, application/octet-stream, */*"
      }
    });

    if (!response.ok) {
      throw new Error(`Upstream returned ${response.status}`);
    }

    const content = await response.text();
    // 原文放 KV 做短期缓存，D1 只保存解析后的节点，避免数据库承载大文本。
    await env.KV.put(`${sourceRawKeyPrefix}:${sourceId}`, content, {
      expirationTtl: 60 * 60 * 24
    });

    const nodes = parseSubscription(content);
    // 源节点按快照替换，确保上游删除节点后本地不会残留旧节点。
    const nodeCount = await replaceSourceNodes(env.DB, sourceId, nodes);
    await markSourceRefreshStatus(env.DB, sourceId, "success");
    await markRefreshJobFinished(env.DB, jobId, "success", `Parsed ${nodeCount} nodes`);

    return {
      sourceId,
      nodeCount,
      status: "success"
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown refresh error";
    await markSourceRefreshStatus(env.DB, sourceId, "failed", message);
    await markRefreshJobFinished(env.DB, jobId, "failed", message);

    return {
      sourceId,
      nodeCount: 0,
      status: "failed"
    };
  }
}

export async function refreshEnabledSources(env: Env): Promise<SourceRefreshAllDto> {
  const sourceIds = await listEnabledSourceIds(env.DB);
  const results: SourceRefreshDto[] = [];

  // Worker 刷新外部订阅源时串行执行，降低上游限速和 Worker 子请求峰值风险。
  for (const sourceId of sourceIds) {
    const result = await refreshSource(env, sourceId);

    if (result) {
      results.push(result);
    }
  }

  return {
    total: sourceIds.length,
    success: results.filter((result) => result.status === "success").length,
    failed: results.filter((result) => result.status === "failed").length,
    nodeCount: results.reduce((total, result) => total + result.nodeCount, 0),
    results
  };
}

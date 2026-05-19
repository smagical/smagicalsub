import { beforeAll, describe, expect, it } from "vitest";
import { ensureResourceSchema, postRawJson } from "./resource-fixtures";

beforeAll(async () => {
  await ensureResourceSchema();
});

describe("node import", () => {
  it("imports valid nodes, reports invalid lines, and truncates long node names", async () => {
    const longName = "A".repeat(140);
    const ssUri = `ss://${btoa("aes-256-gcm:pass@batch.example.com:8388")}#${longName}`;
    const response = await postRawJson("secret", "/api/nodes/import", {
      enabled: true,
      groups: ["Proxy"],
      items: [
        { line: 1, uri: ssUri },
        { line: 3, uri: "bad://node" }
      ]
    });
    const payload = (await response.json()) as {
      data: {
        created: Array<{ groups: string[]; name: string; protocol: string }>;
        failed: Array<{ line: number; message: string; value: string }>;
        total: number;
      };
    };

    expect(response.status).toBe(201);
    expect(payload.data.total).toBe(2);
    expect(payload.data.created).toHaveLength(1);
    expect(payload.data.created[0]).toEqual(
      expect.objectContaining({
        groups: ["Proxy"],
        protocol: "ss"
      })
    );
    expect(payload.data.created[0]?.name).toHaveLength(120);
    expect(payload.data.failed).toEqual([
      expect.objectContaining({
        line: 3,
        message: "节点链接解析失败",
        value: "bad://node"
      })
    ]);
  });

  it("returns import failures even when all lines are invalid", async () => {
    const response = await postRawJson("secret", "/api/nodes/import", {
      enabled: true,
      groups: [],
      items: [{ line: 1, uri: "bad://node" }]
    });
    const payload = (await response.json()) as { data: { created: unknown[]; failed: Array<{ line: number }>; total: number } };

    expect(response.status).toBe(400);
    expect(payload.data).toEqual({
      created: [],
      failed: [expect.objectContaining({ line: 1 })],
      total: 1
    });
  });
});

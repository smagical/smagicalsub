export type ParsedNode = {
  name: string;
  protocol: string;
  server?: string;
  port?: number;
  rawUri: string;
  config: Record<string, unknown>;
};

export type NodeRow = {
  id: string;
  owner_id: string | null;
  source_id: string | null;
  name: string;
  protocol: string;
  server: string | null;
  port: number | null;
  tags: string;
  enabled: number;
  updated_at: string;
};

export type RenderableNodeRow = {
  id: string;
  name: string;
  protocol: string;
  config_json: string;
  tags: string;
};

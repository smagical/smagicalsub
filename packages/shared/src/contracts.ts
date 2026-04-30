export type ListDto<T> = {
  items: T[];
};

export type HealthDto = {
  status: string;
  env: string;
  timestamp: string;
};

export type DashboardDto = {
  totals: {
    sources: number;
    nodes: number;
    profiles: number;
    tokens: number;
  };
  recentEvents: Array<{
    id: string;
    title: string;
    status: "success" | "warning" | "error";
    time: string;
  }>;
};

export type SourceDto = {
  id: string;
  name: string;
  url: string;
  enabled: number;
  last_status: string | null;
  last_error: string | null;
  last_fetched_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SourceRefreshDto = {
  sourceId: string;
  nodeCount: number;
  status: "success" | "failed";
};

export type NodeDto = {
  id: string;
  source_id: string | null;
  name: string;
  protocol: string;
  server: string | null;
  port: number | null;
  groups: string[];
  enabled: number;
  updated_at: string;
};

export type ProfileDto = {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  default_strategy: string;
  enabled: number;
  created_at: string;
  updated_at: string;
};

export type SubscribeTokenDto = {
  id: string;
  owner_id: string | null;
  profile_id: string | null;
  token: string;
  name: string;
  enabled: number;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

export type AccessLogDto = {
  id: string;
  token_id: string | null;
  token_name: string | null;
  path: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

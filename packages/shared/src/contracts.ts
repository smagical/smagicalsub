export type ListDto<T> = {
  items: T[];
};

export type HealthDto = {
  authRequired: boolean;
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

export type SiteSettingsDto = {
  siteName: string;
  siteSubtitle: string;
  titleImageUrl: string | null;
  loginTitle: string;
  loginDescription: string;
};

export type UserRole = "admin" | "user";

export type UserDto = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type AuthUserDto = Pick<UserDto, "email" | "id" | "name" | "role">;

export type AuthStatusDto = {
  authRequired: boolean;
  bootstrapRequired: boolean;
  bootstrapRequiresToken: boolean;
};

export type LoginDto = {
  token: string;
  expiresAt: string;
  user: AuthUserDto;
};

export type SessionDto = {
  id: string;
  created_at: string;
  expires_at: string;
  current: boolean;
};

export const defaultSiteSettings: SiteSettingsDto = {
  siteName: "Smagical Sub",
  siteSubtitle: "多格式订阅管理",
  titleImageUrl: null,
  loginTitle: "管理员访问",
  loginDescription: "使用管理员或用户账号登录控制台。"
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

export type SourceRefreshAllDto = {
  total: number;
  success: number;
  failed: number;
  nodeCount: number;
  results: SourceRefreshDto[];
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

export type ProfileRuleDto = {
  id: string;
  profile_id: string;
  position: number;
  rule: string;
  enabled: number;
};

export type SubscribeTokenDto = {
  id: string;
  owner_id: string | null;
  profile_id: string | null;
  profile_name: string | null;
  token: string;
  custom_path: string | null;
  node_ids: string[];
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

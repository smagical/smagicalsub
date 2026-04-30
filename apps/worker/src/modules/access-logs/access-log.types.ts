export type AccessLogRow = {
  id: string;
  token_id: string | null;
  token_name: string | null;
  path: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

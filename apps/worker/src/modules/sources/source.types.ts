export type SourceRow = {
  id: string;
  owner_id: string | null;
  name: string;
  url: string;
  groups: string;
  enabled: number;
  refresh_interval_minutes: number;
  next_refresh_at: string | null;
  last_status: string | null;
  last_error: string | null;
  last_fetched_at: string | null;
  created_at: string;
  updated_at: string;
};

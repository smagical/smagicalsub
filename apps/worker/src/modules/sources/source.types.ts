export type SourceRow = {
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


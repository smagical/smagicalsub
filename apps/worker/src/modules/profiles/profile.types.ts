export type ProfileRow = {
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  default_strategy: string;
  enabled: number;
  created_at: string;
  updated_at: string;
};


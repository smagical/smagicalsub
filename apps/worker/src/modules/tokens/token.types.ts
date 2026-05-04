export type SubscribeTokenRow = {
  id: string;
  owner_id: string | null;
  profile_id: string | null;
  profile_name: string | null;
  token: string;
  custom_path: string | null;
  node_ids_json: string;
  node_ids: string[];
  name: string;
  enabled: number;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

export type ActiveSubscribeTokenRow = {
  id: string;
  owner_id: string | null;
  token: string;
  custom_path: string | null;
  node_ids_json: string;
  node_ids: string[];
  name: string;
  profile_id: string | null;
  profile_name: string | null;
  profile_default_strategy: string | null;
  profile_enabled: number | null;
};

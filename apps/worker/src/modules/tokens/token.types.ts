export type SubscribeTokenRow = {
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

export type ActiveSubscribeTokenRow = {
  id: string;
  token: string;
  name: string;
  profile_id: string | null;
};


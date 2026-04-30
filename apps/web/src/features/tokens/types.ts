export type TokenFormState = {
  name: string;
  profile_id: string;
  expires_at: string;
  enabled: boolean;
};

export const initialTokenFormState: TokenFormState = {
  name: "",
  profile_id: "",
  expires_at: "",
  enabled: true
};

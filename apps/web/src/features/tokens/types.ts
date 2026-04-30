export type TokenFormState = {
  name: string;
  expires_at: string;
  enabled: boolean;
};

export const initialTokenFormState: TokenFormState = {
  name: "",
  expires_at: "",
  enabled: true
};

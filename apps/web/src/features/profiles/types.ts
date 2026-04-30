export type ProfileFormState = {
  name: string;
  description: string;
  default_strategy: string;
  enabled: boolean;
};

export const initialProfileFormState: ProfileFormState = {
  name: "",
  description: "",
  default_strategy: "Proxy",
  enabled: true
};

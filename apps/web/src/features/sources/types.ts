export type SourceFormState = {
  name: string;
  url: string;
  enabled: boolean;
};

export const initialSourceFormState: SourceFormState = {
  name: "",
  url: "",
  enabled: true
};


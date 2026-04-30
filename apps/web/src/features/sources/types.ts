export type SourceFormState = {
  name: string;
  url: string;
  enabled: boolean;
};

export type SourceEditFormState = {
  name: string;
  url: string;
};

export const initialSourceFormState: SourceFormState = {
  name: "",
  url: "",
  enabled: true
};

export const initialSourceEditFormState: SourceEditFormState = {
  name: "",
  url: ""
};

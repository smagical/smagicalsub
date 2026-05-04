export type SourceFormState = {
  name: string;
  url: string;
  groups: string;
  refresh_interval_minutes: string;
  enabled: boolean;
};

export type SourceEditFormState = {
  name: string;
  url: string;
  groups: string;
  refresh_interval_minutes: string;
};

export const initialSourceFormState: SourceFormState = {
  name: "",
  url: "",
  groups: "",
  refresh_interval_minutes: "0",
  enabled: true
};

export const initialSourceEditFormState: SourceEditFormState = {
  name: "",
  url: "",
  groups: "",
  refresh_interval_minutes: "0"
};

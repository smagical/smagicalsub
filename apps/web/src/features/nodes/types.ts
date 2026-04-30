export type NodeFormState = {
  uri: string;
  name: string;
  groups: string;
  enabled: boolean;
};

export const initialNodeFormState: NodeFormState = {
  uri: "",
  name: "",
  groups: "",
  enabled: true
};


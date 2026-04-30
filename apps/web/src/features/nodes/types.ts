export type NodeFormState = {
  uri: string;
  name: string;
  groups: string;
  enabled: boolean;
};

export type NodeEditFormState = {
  name: string;
  groups: string;
};

export type NodeBatchFormState = {
  groups: string;
};

export const initialNodeFormState: NodeFormState = {
  uri: "",
  name: "",
  groups: "",
  enabled: true
};

export const initialNodeEditFormState: NodeEditFormState = {
  name: "",
  groups: ""
};

export const initialNodeBatchFormState: NodeBatchFormState = {
  groups: ""
};

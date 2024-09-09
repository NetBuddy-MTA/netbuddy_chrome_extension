export type Variable = {
  originalName: string,
  name: string,
  type: string,
  optional: boolean,
  defaultValue?: unknown
};

export type Action = {
  actionString: string,
  inputs: Variable[],
  outputs: Variable[]
};

export type Sequence = {
  id: string,
  name: string,
  description: string,
  actions: Action[]
};

export type SequenceResult = {
  id: string;
  startAt: Date;
  endAt: Date;
  results: ActionResult[];
}

export type ActionResult = {
  action: Action;
  startAt: Date;
  endAt: Date;
  actionContext: Record<string, string>;
  actionLogs: {key: string, value: string}[];
  actionOutputs: Record<string, string>;
  fatal?: boolean;
};

export type Selector = {
  id: string;
  url: string;
  name: string;
  stages: SelectorStage[];
  base64Image?: string;
};

export type SelectorStage = {
  tag: string;
  attributes: { [key: string]: string };
  useAttributes: { [key: string]: boolean };
  attributeFullMatch: { [key: string]: boolean };
  inUse: boolean;
};
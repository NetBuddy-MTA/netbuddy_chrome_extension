export type Variable = {
  originalName: string,
  name: string,
  type: string,
  optional: boolean,
  defaultValue?: unknown
}

export type Action = {
  ActionString: string,
  inputs: Variable[],
  outputs: Variable[]
};

export type ActionParams = {
  inputs: Variable[],
  outputs: Variable[]
}

export type Sequence = {
  id: string,
  name: string,
  description: string,
  actions: Action[]
};

export type ActionResult = {
  action: number,
  data: JSON
};
import {Selector} from "./data.ts";

export function selectorToString(selector: Selector): string {
  let selectorString = "";
  let prevInUse = false;
  for (const stage of selector.stages) {
    // if the stage is not in use, skip it and set the prevInUse flag to false
    if (!stage.inUse) {
      prevInUse = false;
      continue;
    }
    // initialize the stage string according to the context
    let stageString = prevInUse ? " > " : (selectorString === "" ? "" : " ");
    // set the prevInUse flag to true
    prevInUse = true;
    // add the tag to the stage string
    stageString += stage.tag;
    // add the attributes in use to the stage string
    stage.attributes.forEach((value, key) => {
      if (!stage.useAttributes.get(key)) return;
      stageString += `[${key}="${value}"]`;
    });
    
    // add the stage string to the selector string
    selectorString += stageString;
  }
  return selectorString;
}
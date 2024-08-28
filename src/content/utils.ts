// surrounds an area of the page with red borders
import {Selector} from "../shared/data.ts";

export function addDebugRects(rects: DOMRect[]) {
  const divs: HTMLElement[] = [];
  for (const rect of rects) {
    const tableRectDiv = document.createElement("div");
    tableRectDiv.style.position = "absolute";
    tableRectDiv.style.border = "3px dashed red";
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
    tableRectDiv.style.top = `${Math.max(rect.top + scrollTop - 3, 0)}px`;
    tableRectDiv.style.left = `${Math.max(rect.left + scrollLeft - 3, 0)}px`;
    tableRectDiv.className = "NetBuddyOverlayRect";
    // We want rect.width to be the border width, so content width is 2px less.
    tableRectDiv.style.width = `${rect.width + 6}px`;
    tableRectDiv.style.height = `${rect.height + 6}px`;
    document.documentElement.appendChild(tableRectDiv);
    divs.push(tableRectDiv);
  }
  return divs;
}

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
    for (const key in stage.attributes) {
      if (!stage.useAttributes[key]) continue;
      stageString += `[${key}="${stage.attributes[key]}"]`;
    }

    // add the stage string to the selector string
    selectorString += stageString;
  }
  return selectorString;
}
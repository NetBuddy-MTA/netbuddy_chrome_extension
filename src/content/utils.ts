// surrounds an area of the page with red borders
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
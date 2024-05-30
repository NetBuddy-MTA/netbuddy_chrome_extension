// initializes the alarm that tries to run a sequence from the queue every roughly 4 seconds
export const InitSequenceAlarm = (callback: () => void) => {
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason !== 'install') return;
    await chrome.alarms.create('netbuddy_run_alarm', {periodInMinutes: 1/16});
  });
  
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'netbuddy_run_alarm') {
      await chrome.storage.local.get([]); // keep alive
      callback();
    }
  });
}

// surrounds an area of the page with red borders
export function addDebugRects(rects: DOMRect[]) {
  for (const rect of rects) {
    const tableRectDiv = document.createElement("div");
    tableRectDiv.style.position = "absolute";
    tableRectDiv.style.border = "1px solid red";
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
    tableRectDiv.style.margin = tableRectDiv.style.padding = "0";
    tableRectDiv.style.top = `${rect.top + scrollTop}px`;
    tableRectDiv.style.left = `${rect.left + scrollLeft}px`;
    // We want rect.width to be the border width, so content width is 2px less.
    tableRectDiv.style.width = `${rect.width - 2}px`;
    tableRectDiv.style.height = `${rect.height - 2}px`;
    document.body.appendChild(tableRectDiv);
  }
}
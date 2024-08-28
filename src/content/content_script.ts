import {
  clickElement,
  findElementBySelector,
  findElementsBySelector,
  readElementText,
  writeElementText
} from "./content_actions.ts";
import {Action} from "../shared/data.ts";

// adding listener for messages from extension
chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  if (message as {action: Action, context: Record<string, unknown>} && message.action && message.context) {
    const {action, context, tabId} = message;
    console.log(`Received action: ${action.actionString}`);
    switch (action.actionString) {
      case 'ClickElement':
        sendResponse(clickElement(action, context));
        break;

      case 'ReadElementText':
        sendResponse(readElementText(action, context));
        break;

      case 'WriteElementText':
        sendResponse(writeElementText(action, context));
        break;
        
      case 'FindElementsBySelector':
        sendResponse(findElementsBySelector(action, context, tabId));
        break;
        
      case 'FindElementBySelector':
        sendResponse(findElementBySelector(action, context, tabId));
        break;
    }
  }
  else sendResponse(message);
});






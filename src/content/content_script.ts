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
    const {action, context} = message;
    console.log("action:");
    console.log(action);
    console.log("context:");
    console.log(context);
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
        sendResponse(findElementsBySelector(action, context));
        break;
        
      case 'FindElementBySelector':
        sendResponse(findElementBySelector(action, context));
        break;
    }
  }
});






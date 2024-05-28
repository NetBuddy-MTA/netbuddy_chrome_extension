import {clickElement, readElementText, writeElementText} from "./content_actions.ts";
import {Action} from "../shared/data.ts";

// adding listener for messages from extension
chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  if (message as {action: Action, context: Map<string, unknown>} && message.action && message.context) {
    const {action, context} = message;
    switch (action.actionString) {
      case 'ClickElement':
        sendResponse(clickElement(action, context));
        break;

      case 'ReadElementText':
        sendResponse(readElementText(action, context));
        break;

      case 'WriteElementText':
        sendResponse(writeElementText(message.element, message.storeResult));
        break;
    }
  }
});






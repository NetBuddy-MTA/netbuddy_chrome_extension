// keep alive
import {Action} from "../shared/data.ts";
import Tab = chrome.tabs.Tab;

// creates a new chrome window and returns the window object
export async function createWindow(action: Action, context: Record<string, unknown>) {
  // create the window
  const window = await chrome.windows.create();
  // get the window output variable if exists in context
  const windowOutput = action.outputs.find(value => value.originalName === 'Window');
  // store the window in the context
  if (windowOutput) context[windowOutput.name] = window;
  return window;
}

// creates a new tab and returns the tab object
// url?: string - the URL to navigate to
export async function createTab(action: Action, context: Record<string, unknown>) {
  // get the window input variable if exists in context
  const windowInput = action.inputs.find(value => value.originalName === 'Window');
  if (!windowInput) return;
  // get the window from the context
  const windowParam = context[windowInput.name];
  const window = windowParam as chrome.windows.Window;
  // get the url input variable if exists in context
  const urlInput = action.inputs.find(value => value.originalName === 'Url');
  let url;
  if (urlInput) {
    // get the url from the context
    const urlParam = context[urlInput.name];
    url = urlParam as string;
  }
  // create the tab
  const tab = await chrome.tabs.create({windowId: window.id, url});
  // get the tab output variable if exists in context
  const tabOutput = action.outputs.find(value => value.originalName === 'Tab');
  // store the tab in the context
  if (tabOutput) context[tabOutput.name] = tab;
  return tab;
}

// navigates to a URL in a tab
export async function navigateToURL(action: Action, context: Record<string, unknown>) {
  // get the tab input variable if exists in context
  const tabInput = action.inputs.find(value => value.originalName === 'Tab');
  if (!tabInput) return;
  // get the tab from the context
  const tab = context[tabInput.name] as Tab;
  // check if the tab is associated with a tab id
  if (!tab.id) return;
  // get the url input variable if exists in context
  const urlInput = action.inputs.find(value => value.originalName === 'Url');
  if (!urlInput) return;
  // get the url from the context
  const url = context[urlInput.name] as string;
  
  const result = await chrome.tabs.update(tab.id, {url});
  
  // get the tab output variable if exists in context
  const tabOutput = action.outputs.find(value => value.originalName === 'Tab');
  // store the tab in the context
  if (tabOutput) context[tabOutput.name] = result;
  return result;
}

// closes a chrome window
export async function closeWindow(action: Action, context: Record<string, unknown>) {
  // get the window input variable
  const windowInput = action.inputs.find(value => value.originalName === 'Window');
  if (!windowInput) return;
  // get the window from the context
  const window = context[windowInput.name] as chrome.windows.Window;
  // close the window
  await chrome.windows.remove(window.id!);
}

// sends an http/s request and stores the response
export async function httpRequest(action: Action,  context: Record<string, unknown>) {
  // get the request url input variable
  const urlInput = action.inputs.find(value => value.originalName === 'Url');
  // get the method input variable
  const methodInput = action.inputs.find(value => value.originalName === 'Method');
  // get the headers input variable
  const headersInput = action.inputs.find(value => value.originalName === 'Headers');
  // check that all mandatory variables are defined and set all optionals to default
  if (!urlInput) return;
  const url = context[urlInput.name] as string;

  let method, headers;
  
  if (!methodInput) method = 'GET';
  else method = context[methodInput.name] as string;
  
  if (!headersInput) headers = {};
  else headers = context[headersInput.name] as Headers;
  
  // send request
  const response = await fetch(url, {method, headers});
  
  // get the response output variable
  const responseOutput = action.outputs.find(value => value.originalName === 'Response');
  if (responseOutput) context[responseOutput.name] = response; 
  
  return response;
}

// Get the elements that match the xpath query
export async function findElementsBySelector(action: Action, context: Record<string, unknown>) {
  // find the selector input variable in the context
  const selectorInput = action.inputs.find(value => value.originalName === 'Selector');
  // find the tab input variable in the context
  const tabInput = action.inputs.find(value => value.originalName === 'Tab');
  // if the selector or tab input is not found, return an empty object
  if (!selectorInput || !tabInput) return [];
  // get the tab from the context
  const tab = context[tabInput.name] as Tab;
  // make the tab active
  await chrome.tabs.update(tab.id!, {active: true});
  // request the content script to find the elements
  return await chrome.tabs.sendMessage(tab.id!, {action: action, context}) as HTMLElement[];
}

// Get the element that match the query string
export async function findElementBySelector(action: Action, context: Record<string, unknown>) {
  const [first] = await findElementsBySelector(action, context)
  return first;
}

// sends a message to the content script of a tab and returns the result
export async function contentScriptAction(action: Action, context: Record<string, unknown>) {
  // get the tab input variable if exists in context
  const tabInput = action.inputs.find(value => value.originalName === 'Tab');
  if (!tabInput) return;
  // get the tab from the context
  const tab = context[tabInput.name] as Tab;
  // send the message to the content script of the tab
  const result = await chrome.tabs.sendMessage(tab.id as number, {action: action, context});
  // get all the outputs from the result and save them to the context
  action.outputs.forEach(value => context[value.name] = result[value.name]);
  return result;
}


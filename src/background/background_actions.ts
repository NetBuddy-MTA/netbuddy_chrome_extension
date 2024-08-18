// keep alive
import {Action, Variable} from "../shared/data.ts";
import Tab = chrome.tabs.Tab;

function CreateEmptyResult(): {actionLogs: {key: string, value: string}[], actionOutputs: Map<Variable, unknown>} {
  return {actionLogs: [], actionOutputs: new Map()};
}

// creates a new chrome window and returns the window object
export async function createWindow(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // create the window
  const window = await chrome.windows.create();
  actionLogs.push({key: "Success", value: `Window created (id ${window.id?.toString()})`})
  // get the window output variable if exists in context
  const windowOutput = action.outputs.find(value => value.originalName === 'Window');
  // store the window in the context
  if (windowOutput) {
    context[windowOutput.name] = window;
    actionOutputs.set(windowOutput, window);
  }
  else {
    actionLogs.push({key: "Warning", value: "Window output not defined!"});
  }
  return {actionLogs, actionOutputs};
}

// creates a new tab and returns the tab object
// url?: string - the URL to navigate to
export async function createTab(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // get the window input variable if exists in context
  const windowInput = action.inputs.find(value => value.originalName === 'Window');
  if (!windowInput) {
    actionLogs.push({key: "Error", value: "Window input not defined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }
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
    if (url[0] === "\"") url = url.slice(1, -1);
    actionLogs.push({key: "Info", value: `Navigating to ${url}`})
  }
  // create the tab
  const tab = await chrome.tabs.create({windowId: window.id, url});
  // get the tab output variable if exists in context
  const tabOutput = action.outputs.find(value => value.originalName === 'Tab');
  // store the tab in the context
  if (tabOutput) {
    context[tabOutput.name] = tab;
    actionOutputs.set(tabOutput, tab);
  }
  else {
    // todo: make sure this is necessary, tab might not need to be re-stored after changing url, needs more testing
    actionLogs.push({key: "Warning", value: "Tab output not defined!"});
  }
  return {actionLogs, actionOutputs};
}

// navigates to a URL in a tab
export async function navigateToURL(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // get the tab input variable if exists in context
  const tabInput = action.inputs.find(value => value.originalName === 'Tab');
  if (!tabInput) {
    actionLogs.push({key: "Error", value: "Tab input not defined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }
  // get the tab from the context
  const tab = context[tabInput.name] as Tab;
  // check if the tab is associated with a tab id
  if (!tab.id) {
    actionLogs.push({key: "Error", value: "Tab id not defined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }
  // get the url input variable if exists in context
  const urlInput = action.inputs.find(value => value.originalName === 'Url');
  if (!urlInput) {
    actionLogs.push({key: "Warning", value: "Url input not defined! (this is a no-operation action)"});
    return {actionLogs, actionOutputs};
  }
  // get the url from the context
  let url = context[urlInput.name] as string;
  if (url[0] === "\"") url = url.slice(1, -1);
  actionLogs.push({key: "Info", value: `Navigating to ${url}`})
  
  const result = await chrome.tabs.update(tab.id, {url});
  
  // get the tab output variable if exists in context
  const tabOutput = action.outputs.find(value => value.originalName === 'Tab');
  // store the tab in the context
  if (tabOutput) {
    context[tabOutput.name] = result;
    actionOutputs.set(tabOutput, result);
  }
  else {
    // todo: make sure this is necessary, tab might not need to be re-stored after changing url, needs more testing
    actionLogs.push({key: "Warning", value: "Tab output not defined!"});
  }
  
  return {actionLogs, actionOutputs};
}

// closes a chrome window
export async function closeWindow(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // get the window input variable
  const windowInput = action.inputs.find(value => value.originalName === 'Window');
  if (!windowInput) {
    actionLogs.push({key: "Error", value: "Window input not defined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }
  // get the window from the context
  const window = context[windowInput.name] as chrome.windows.Window;
  // close the window
  const id = window.id;
  await chrome.windows.remove(window.id!);
  actionLogs.push({key: "Success", value: `Window closed (id ${id?.toString()})`})
  
  return {actionLogs, actionOutputs};
}

// sends an http/s request and stores the response
export async function httpRequest(action: Action,  context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // get the request url input variable
  const urlInput = action.inputs.find(value => value.originalName === 'Url');
  // get the method input variable
  const methodInput = action.inputs.find(value => value.originalName === 'Method');
  // get the headers input variable
  const headersInput = action.inputs.find(value => value.originalName === 'Headers');
  // check that all mandatory variables are defined and set all optionals to default
  if (!urlInput) {
    actionLogs.push({key: "Error", value: "Url input not defined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }
  const url = context[urlInput.name] as string;

  let method, headers;
  
  if (!methodInput) {
    method = 'GET';
    actionLogs.push({key: "Warning", value: "Method input not defined! (defaulting to GET)"});
  }
  else {
    method = context[methodInput.name] as string;
    actionLogs.push({key: "Info", value: `Method: ${method}`});
  }
  
  if (!headersInput) {
    headers = {};
    actionLogs.push({key: "Warning", value: "Headers input not defined! (defaulting to empty object)"});
  }
  else
  {
    headers = context[headersInput.name] as Headers;
    actionLogs.push({key: "Info", value: `Headers: ${JSON.stringify(headers)}`});
  }
  
  // send request
  const response = await fetch(url, {method, headers});
  
  // get the response output variable
  const responseOutput = action.outputs.find(value => value.originalName === 'Response');
  if (responseOutput) {
    context[responseOutput.name] = response;
    actionOutputs.set(responseOutput, response);
    actionLogs.push({key: "Success", value: "Response saved to output variable"});
  } 
  else {
    actionLogs.push({key: "Warning", value: "Response output not defined!"});
  }
  
  return {actionLogs, actionOutputs};
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
  
  while ((await chrome.tabs.get(tab.id!)).status !== 'complete');
  
  // request the content script to find the elements
  const results = await chrome.tabs.sendMessage(tab.id!, {action, context}) as HTMLElement[];
  
  // find the output element variable
  const elementsOutput = action.outputs.find(value => value.originalName === 'Elements');
  // if elements output exists save result to it 
  if (elementsOutput) context[elementsOutput.name] = results.map(() => undefined);
  // find the output count variable
  const countOutput = action.outputs.find(value => value.originalName === 'Count');
  // if the count output exists save the length to it
  if (countOutput) context[countOutput.name] = results.length;
  return results;
}

// Get the element that match the query string
export async function findElementBySelector(action: Action, context: Record<string, unknown>) {
  // find the selector input variable in the context
  const selectorInput = action.inputs.find(value => value.originalName === 'Selector');
  // find the tab input variable in the context
  const tabInput = action.inputs.find(value => value.originalName === 'Tab');
  // if the selector or tab input is not found, return an empty object
  if (!selectorInput || !tabInput) return undefined;
  // get the tab from the context
  const tab = context[tabInput.name] as Tab;
  // make the tab active
  await chrome.tabs.update(tab.id!, {active: true});

  while ((await chrome.tabs.get(tab.id!)).status !== 'complete');

  // request the content script to find the elements
  const result = await chrome.tabs.sendMessage(tab.id!, {action, context}) as HTMLElement[];

  // find the output element variable
  const elementOutput = action.outputs.find(value => value.originalName === 'Element');
  // if elements output exists save result to it 
  if (elementOutput) context[elementOutput.name] = undefined;
  return result;
}

// sends a message to the content script of a tab and returns the result
export async function contentScriptAction(action: Action, context: Record<string, unknown>) {
  // get the tab input variable if exists in context
  const tabInput = action.inputs.find(value => value.originalName === 'Tab');
  let tab: undefined | Tab;
  // get the tab from the context
  if (tabInput) tab = context[tabInput.name] as Tab;
  // or the active tab
  else [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  // send the message to the content script of the tab
  const result = await chrome.tabs.sendMessage(tab.id as number, {action, context});
  // get all the outputs from the result and save them to the context
  action.outputs.forEach(value => context[value.name] = result[value.name]);
  return result;
}


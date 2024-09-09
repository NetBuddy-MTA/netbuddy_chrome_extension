// keep alive
import {Action} from "../shared/data.ts";
import Tab = chrome.tabs.Tab;

function CreateEmptyResult(): {actionLogs: {key: string, value: string}[], actionOutputs: Record<string, string>} {
  return {actionLogs: [], actionOutputs: {}};
}

function delay(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
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
    actionOutputs[windowOutput.name] = JSON.stringify(window);
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
    actionLogs.push({key: "Info", value: `Navigating to ${url}`})
  }
  // create the tab
  let tab = await chrome.tabs.create({windowId: window.id, url});
  while (tab.status !== 'complete') tab = await chrome.tabs.get(tab.id!)// wait for tab to load
  // get the tab output variable if exists in context
  const tabOutput = action.outputs.find(value => value.originalName === 'Tab');
  // store the tab in the context
  if (tabOutput) {
    context[tabOutput.name] = tab;
    actionOutputs[tabOutput.name] = JSON.stringify(tab);
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
  const url = context[urlInput.name] as string;
  actionLogs.push({key: "Info", value: `Navigating to ${url}`})
  
  const result = await chrome.tabs.update(tab.id, {url});
  
  // get the tab output variable if exists in context
  const tabOutput = action.outputs.find(value => value.originalName === 'Tab');
  // store the tab in the context
  if (tabOutput) {
    context[tabOutput.name] = result;
    actionOutputs[tabOutput.name] = JSON.stringify(result);
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
    actionOutputs[responseOutput.name] = JSON.stringify(response);
    actionLogs.push({key: "Success", value: "Response saved to output variable"});
  } 
  else {
    actionLogs.push({key: "Warning", value: "Response output not defined!"});
  }
  
  return {actionLogs, actionOutputs};
}

// subtracts 2 numbers
export function subtractNumbersAction(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // find the input number to subtract from
  const subtractFromInput = action.inputs.find(value => value.originalName === "Subtract From");
  // find the input number to subtract 
  const subtractInput = action.inputs.find(value => value.originalName === "To Subtract");
  
  if (!subtractFromInput) {
    actionLogs.push({key: "Error", value: "Subtract From input is undefined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }
  
  if (!subtractInput) {
    actionLogs.push({key: "Error", value: "To Subtract input is undefined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }
  
  const subtractFrom = context[subtractFromInput.name] as number;
  const toSubtract = context[subtractInput.name] as number;
  
  const result = subtractFrom - toSubtract;
  
  // find the result output variable
  const resultOutput = action.outputs.find(value => value.originalName === "Result");
  
  if (resultOutput) {
    context[resultOutput.name] = result;
    actionOutputs[resultOutput.name] = JSON.stringify(result);
    actionLogs.push({key: "Success", value: "Result was saved to output"})
  }
  else {
    actionLogs.push({key: "Warning", value: "Result output is undefined!"});
  }
  
  return {actionLogs, actionOutputs};
}

// Multiplies 2 numbers
export function multiplyNumbersAction(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();

  // find the multiplier number
  const multiplier = action.inputs.find(value => value.originalName === "Multiplier");
  // find the multiplicand number
  const multiplicand = action.inputs.find(value => value.originalName === "Multiplicand");

  if (!multiplier) {
    actionLogs.push({key: "Error", value: "The multiplier number is undefined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }

  if (!multiplicand) {
    actionLogs.push({key: "Error", value: "The Multiplicand number is undefined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }

  const multiplierNumber = context[multiplier.name] as number;
  const multiplicandNumber = context[multiplicand.name] as number;

  const result = multiplierNumber * multiplicandNumber;

  // find the result output variable
  const resultOutput = action.outputs.find(value => value.originalName === "Result");

  if (resultOutput) {
    context[resultOutput.name] = result;
    actionOutputs[resultOutput.name] = JSON.stringify(result);
    actionLogs.push({key: "Success", value: "Result was saved to output"})
  }
  else {
    actionLogs.push({key: "Warning", value: "Result output is undefined!"});
  }

  return {actionLogs, actionOutputs};
}

// Divide 2 numbers
export function diviveNumbersAction(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();

  // find the dividend number
  const dividend = action.inputs.find(value => value.originalName === "Dividend");
  // find the divisor number
  const divisor = action.inputs.find(value => value.originalName === "Divisior");

  if (!dividend) {
    actionLogs.push({key: "Error", value: "The devidend number is undefined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }

  if (!divisor) {
    actionLogs.push({key: "Error", value: "The divisor number is undefined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }

  const dividendNumber = context[dividend.name] as number;
  const divisorNumber = context[divisor.name] as number;

  const result = dividendNumber / divisorNumber;

  // find the result output variable
  const resultOutput = action.outputs.find(value => value.originalName === "Result");

  if (resultOutput) {
    context[resultOutput.name] = result;
    actionOutputs[resultOutput.name] = JSON.stringify(result);
    actionLogs.push({key: "Success", value: "Result was saved to output"})
  }
  else {
    actionLogs.push({key: "Warning", value: "Result output is undefined!"});
  }

  return {actionLogs, actionOutputs};
}

// Addition of 2 numbers
export function additionNumbersAction(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();

  // find the first input number to add from
  const firstAddend = action.inputs.find(value => value.originalName === "First Addend");
  // find the second input number to add from
  const secondAddend = action.inputs.find(value => value.originalName === "Second Addend");

  if (!firstAddend) {
    actionLogs.push({key: "Error", value: "First addend number is undefined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }

  if (!secondAddend) {
    actionLogs.push({key: "Error", value: "Second addend number is undefined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }

  const firstAddendNumber = context[firstAddend.name] as number;
  const secondAddendNumber = context[secondAddend.name] as number;

  const result = firstAddendNumber + secondAddendNumber;

  // find the result output variable
  const resultOutput = action.outputs.find(value => value.originalName === "Result");

  if (resultOutput) {
    context[resultOutput.name] = result;
    actionOutputs[resultOutput.name] = JSON.stringify(result);
    actionLogs.push({key: "Success", value: "Result was saved to output"})
  }
  else {
    actionLogs.push({key: "Warning", value: "Result output is undefined!"});
  }

  return {actionLogs, actionOutputs};
}

// waits for a number of milliseconds before continuing
export async function waitForMillisecondsAction(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // get the number of milliseconds variable
  const millisecondsInput = action.inputs.find(value => value.originalName === "Milliseconds");
  
  if (!millisecondsInput) {
    actionLogs.push({key: "Warning", value: "Milliseconds input undefined! will not wait."})
    return {actionLogs, actionOutputs};
  }
  
  const milliseconds = context[millisecondsInput.name] as number
  
  actionLogs.push({key: "Success", value: `Waiting for ${milliseconds} ms`});
  await delay(milliseconds);
  
  return {actionLogs, actionOutputs};
}

// waits for a tab to load
export async function waitForTabToLoad(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();

  // get the tab variable
  const tabInput = action.inputs.find(value => value.originalName === "Tab");
  
  if (!tabInput) {
    actionLogs.push({key: "Warning", value: "Tab input undefined! will not wait."})
    return {actionLogs, actionOutputs};
  }
  
  let tab = context[tabInput.name] as chrome.tabs.Tab;
  
  actionLogs.push({key: "Success", value: `Waiting for tab ${tab.id} to load.`});
  while (tab.status !== 'complete') tab = await chrome.tabs.get(tab.id!) // wait for tab to load
  
  return {actionLogs, actionOutputs};
}

// parse number from string
export function parseNumberAction(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // get the number string variable
  const stringInput = action.inputs.find(value => value.originalName === "Number String");
  
  if (!stringInput) {
    actionLogs.push({key: "Error", value: "Number String input undefined!"});
    return {actionLogs, actionOutputs};
  }
  
  // get the variable value
  const stringVariable = context[stringInput.name] as string;
  // convert to number
  const convertedValue = parseFloat(stringVariable);
  const convertedSuccessfully = !isNaN(convertedValue) && isFinite(convertedValue);

  if (convertedSuccessfully) {
    actionLogs.push({key: "Success", value: `The string was converted to the number ${convertedValue}.`});
  }
  else {
    actionLogs.push({key: "Warning", value: "The string was not converted to a number."});
  }
  
  // get the output variables to save the results in
  const numberOutput = action.outputs.find(value => value.originalName === "Number");
  const convertedOutput = action.outputs.find(value => value.originalName === "Converted Successfully");
  
  if (numberOutput) {
    context[numberOutput.name] = convertedValue;
    actionOutputs[numberOutput.name] = JSON.stringify(convertedValue);
  }
  else {
    actionLogs.push({key: "Warning", value: "The Number output variable is not defined!"});
  }
  
  if (convertedOutput) {
    context[convertedOutput.name] = convertedSuccessfully;
    actionOutputs[convertedOutput.name] = JSON.stringify(convertedSuccessfully);
  }
  else {
    actionLogs.push({key: "Warning", value: "The Converted Successfully output variable is not defined!"});
  }
  
  return {actionLogs, actionOutputs};
}

// parse url from string
export function parseURLAction(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();

  // get the number string variable
  const stringInput = action.inputs.find(value => value.originalName === "URL String");

  if (!stringInput) {
    actionLogs.push({key: "Error", value: "URL String input undefined!"});
    return {actionLogs, actionOutputs};
  }

  // get the variable value
  const stringVariable = context[stringInput.name] as string;
  // convert to number
  let convertedSuccessfully;
  try {
    new URL(stringVariable);
    convertedSuccessfully = true;
    
  } catch (error) {
    convertedSuccessfully = false;
  }

  if (convertedSuccessfully) {
    actionLogs.push({key: "Success", value: `The string is a url.`});
  }
  else {
    actionLogs.push({key: "Warning", value: "The string is not a url."});
  }

  // get the output variables to save the results in
  const urlOutput = action.outputs.find(value => value.originalName === "URL");
  const convertedOutput = action.outputs.find(value => value.originalName === "Converted Successfully");

  if (urlOutput) {
    context[urlOutput.name] = stringVariable;
    actionOutputs[urlOutput.name] = JSON.stringify(stringVariable);
  }
  else {
    actionLogs.push({key: "Warning", value: "The URL output variable is not defined!"});
  }

  if (convertedOutput) {
    context[convertedOutput.name] = convertedSuccessfully;
    actionOutputs[convertedOutput.name] = JSON.stringify(convertedSuccessfully);
  }
  else {
    actionLogs.push({key: "Warning", value: "The Converted Successfully output variable is not defined!"});
  }

  return {actionLogs, actionOutputs};
}

// not gate
export function booleanNotAction(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // get the input
  const boolInput = action.inputs.find(value => value.originalName === "In");
  
  if (boolInput) {
    const ourIn = context[boolInput.name] as boolean;
    const inverted = !ourIn;
    actionLogs.push({key: "Success", value: `Inverted the input to ${inverted}`});
    
    // get the output
    const boolOutput = action.outputs.find(value => value.originalName === "Out");
    if (!boolOutput) {
      actionLogs.push({key: "Warning", value: "Output is not defined!"});
      return {actionLogs, actionOutputs};
    }
    
    context[boolOutput.name] = inverted;
    actionOutputs[boolOutput.name] = JSON.stringify(inverted);
    
    return {actionLogs, actionOutputs};
  }
  else {
    actionLogs.push({key: "Error", value: "The input variable is undefined!"});
    return {actionLogs, actionOutputs};
  }
}

// and gate
export function booleanAndAction(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();

  // get the input
  const bool1Input = action.inputs.find(value => value.originalName === "In 1");
  const bool2Input = action.inputs.find(value => value.originalName === "In 2");

  if (!(bool1Input && bool2Input)) {
    actionLogs.push({key: "Error", value: "Not all inputs are defined!"});
    return {actionLogs, actionOutputs};
  }
  
  const in1 = context[bool1Input.name] as boolean;
  const in2 = context[bool2Input.name] as boolean;
  const result = in1 && in2;

  actionLogs.push({key: "Success", value: `The result is ${result}`});
  
  // find the output
  const resultOutput = action.outputs.find(value => value.originalName === "Out");
  if (!resultOutput) {
    actionLogs.push({key: "Warning", value: "The result output variable is undefined!"});
    return {actionLogs, actionOutputs};
  }
  
  context[resultOutput.name] = result;
  actionOutputs[resultOutput.name] = JSON.stringify(result);
  
  return {actionLogs, actionOutputs};
}

// or gate
export function booleanOrAction(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();

  // get the input
  const bool1Input = action.inputs.find(value => value.originalName === "In 1");
  const bool2Input = action.inputs.find(value => value.originalName === "In 2");

  if (!(bool1Input && bool2Input)) {
    actionLogs.push({key: "Error", value: "Not all inputs are defined!"});
    return {actionLogs, actionOutputs};
  }

  const in1 = context[bool1Input.name] as boolean;
  const in2 = context[bool2Input.name] as boolean;
  const result = in1 || in2;

  actionLogs.push({key: "Success", value: `The result is ${result}`});

  // find the output
  const resultOutput = action.outputs.find(value => value.originalName === "Out");
  if (!resultOutput) {
    actionLogs.push({key: "Warning", value: "The result output variable is undefined!"});
    return {actionLogs, actionOutputs};
  }

  context[resultOutput.name] = result;
  actionOutputs[resultOutput.name] = JSON.stringify(result);

  return {actionLogs, actionOutputs};
}

// get element from elements array
export function elementArrayIndexingAction(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // get the input variables
  const arrayInput = action.inputs.find(value => value.originalName === "Array");
  const indexInput = action.inputs.find(value => value.originalName === "Index");
  
  if (!arrayInput) {
    actionLogs.push({key: "Error", value: "Array input variable is undefined!"});
    return {actionLogs, actionOutputs};
  }
  
  if (!indexInput) {
    actionLogs.push({key: "Error", value: "Index input variable is undefined"});
    return {actionLogs, actionOutputs};
  }
  
  // get the values
  const elementsLabel = context[arrayInput.name] as string;
  const index = context[indexInput.name] as number;
  const indexedElementLabel = `${elementsLabel}_${index}`;
  actionLogs.push({key: "Success", value: `Generated indexed label: ${indexedElementLabel}`});
  
  // get the output variable
  const elementOutput = action.outputs.find(value => value.originalName === "Element");
  
  if (!elementOutput) {
    actionLogs.push({key: "Warning", value: "Element output variable is undefined!"});
    return {actionLogs, actionOutputs};
  }
  
  context[elementOutput.name] = elementOutput;
  actionOutputs[elementOutput.name] = JSON.stringify(elementOutput);
  
  return {actionLogs, actionOutputs};
}

// number less than
export function numberLessThanAction(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // get the inputs
  const firstInput = action.inputs.find(value => value.originalName === "First");
  const secondInput = action.inputs.find(value => value.originalName === "Second");
  
  if (!firstInput) {
    actionLogs.push({key: "Error", value: "First number input is undefined!"});
    return {actionLogs, actionOutputs};
  }
  
  if (!secondInput) {
    actionLogs.push({key: "Error", value: "Second number input is undefined!"});
    return {actionLogs, actionOutputs};
  }
  
  // get the values
  const first = context[firstInput.name] as number;
  const second = context[secondInput.name] as number;
  const result = first < second;
  
  // get the output variable
  const resultOutput = action.outputs.find(value => value.originalName === "Result");
  
  if (!resultOutput) {
    actionLogs.push({key: "Error", value: "Result output is undefined!"});
    return {actionLogs, actionOutputs};
  }
  
  context[resultOutput.name] = result;
  actionOutputs[resultOutput.name] = JSON.stringify(result);
  
  return {actionLogs, actionOutputs};
}

// concatenate strings
export function stringConcatenateAction(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // get input variables
  const firstInput = action.inputs.find(value => value.originalName === "First");
  const secondInput = action.inputs.find(value => value.originalName === "Second");
  
  if (!firstInput) {
    actionLogs.push({key: "Error", value: "First string input is undefined!"});
    return {actionLogs, actionOutputs};
  }
  if (!secondInput) {
    actionLogs.push({key: "Error", value: "Second string input is undefined!"});
    return {actionLogs, actionOutputs};
  }
  
  // get input values
  const first = context[firstInput.name] as string;
  const second = context[secondInput.name] as string;
  const result = first + second;
  
  // get the result output
  const resultOutput = action.outputs.find(value => value.originalName === "Result");
  if (!resultOutput) {
    actionLogs.push({key: "Warning", value: "Result output is undefined!"});
    return {actionLogs, actionOutputs};
  }
  
  context[resultOutput.name] = result;
  actionOutputs[resultOutput.name] = JSON.stringify(result);
  
  return {actionLogs, actionOutputs};
}

// replace string
export async function stringReplaceAction(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // get the input variables
  const mainInput = action.inputs.find(value => value.originalName === "Main String");
  const substringInput = action.inputs.find(value => value.originalName === "Substring");
  const replacementInput = action.inputs.find(value => value.originalName === "Replacement String");

  if (!mainInput) {
    actionLogs.push({key: "Error", value: "Main string input is undefined!"});
    return {actionLogs, actionOutputs};
  }
  if (!substringInput) {
    actionLogs.push({key: "Error", value: "Substring input is undefined!"});
    return {actionLogs, actionOutputs};
  }
  if (!replacementInput) {
    actionLogs.push({key: "Error", value: "Replacement string input is undefined!"});
    return {actionLogs, actionOutputs};
  }
  
  // get the values
  const mainString = context[mainInput.name] as string;
  const substring = context[substringInput.name] as string;
  const replacementString = context[replacementInput.name] as string;
  const result = mainString.replace(substring, replacementString);
  
  // get the output variable
  const resultOutput = action.outputs.find(value => value.originalName === "Result");
  
  if (!resultOutput) {
    actionLogs.push({key: "Warning", value: "Result output is undefined!"});
    return {actionLogs, actionOutputs};
  }
  
  context[resultOutput.name] = result;
  actionOutputs[resultOutput.name] = JSON.stringify(result);
  
  return {actionLogs, actionOutputs};
}

// sends a message to the content script of a tab and returns the result
export async function contentScriptAction(action: Action, context: Record<string, unknown>) {
  // get the tab input variable if exists in context
  const tabInput = action.inputs.find(value => value.originalName === 'Tab');
  let tab: undefined | Tab;
  // get the element input variable if exists in context
  const elementInput = action.inputs.find(value => value.originalName.startsWith('Element'));
  let tabId: number;
  if (tabInput) {
    tab = context[tabInput.name] as Tab;
    tabId = tab.id as number;
  }
  // if there is an element in the context use the label to find the tab
  else if (elementInput) {
    const elementLabel = context[elementInput.name] as string;
    const [idStr] = elementLabel.split('_');
    tabId = parseInt(idStr);
  }
  // or the active tab
  else {
    [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    tabId = tab.id as number;
  }
  // send the message to the content script of the tab
  tab = await chrome.tabs.get(tabId);
  while (tab.status !== 'complete') tab = await chrome.tabs.get(tabId)// wait for tab to load
  const {actionLogs, actionOutputs, ...rest} = await chrome.tabs.sendMessage(tabId, {action, context, tabId});
  // get all the outputs from the result and save them to the context
  action.outputs.forEach(value => context[value.name] = JSON.parse(actionOutputs[value.name]));
  
  return {actionLogs, actionOutputs, rest};
}


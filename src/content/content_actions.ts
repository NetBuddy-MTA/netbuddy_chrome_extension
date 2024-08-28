// Press the parameter element
import {Action} from "../shared/data.ts";

function createUniqueElementLabel() {
  return `NetBuddy-Element-Label-${crypto.randomUUID()}`
}

function CreateEmptyResult(): {actionLogs: {key: string, value: string}[], actionOutputs: Record<string, unknown>} {
  return {actionLogs: [], actionOutputs: {}};
}

export function clickElement(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // find the element input variable in the context
  const elementInput = action.inputs.find(value => value.originalName === 'Element');
  if (elementInput) {
    // get the element label from the context
    const elementLabel = (context[elementInput.name] as string).split('_')[1];
    // get the element from the dom
    const element = document.querySelector(`[${elementLabel}]`);
    // click the element
    if (element as HTMLInputElement) 
      (<HTMLInputElement>element).click();
    else
      actionLogs.push({key: 'Error', value: 'Element is not an input element!'});
  }
  else {
    actionLogs.push({key: 'Error', value: 'Element variable not defined!'});
  }
  
  return {actionLogs, actionOutputs};
}

// read the text contents of the element
export function readElementText(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // find the element input variable in the context
  const elementLabelInput = action.inputs.find(value => value.originalName === 'Element');
  if (elementLabelInput) {
    // get the element from the context
    const elementLabel = (context[elementLabelInput.name] as string).split('_')[1];
    // get the element from the dom
    const element = document.querySelector(`[${elementLabel}]`);
    if (!element) {
      actionLogs.push({key: 'Error', value: 'Element not found!'});
      return {actionLogs, actionOutputs, fatal: true};
    }
    // get the content of the element
    const content = element instanceof HTMLInputElement ? element.value : (<HTMLInputElement>element).innerText;
    // get the text output variable in the context
    const textOutput = action.outputs.find(value => value.originalName === 'Element Text');
    if (textOutput) {
      actionOutputs[textOutput.name] = content;
    } 
    else {
      actionLogs.push({key: 'Warning', value: 'Element Text variable not defined!'});
    }
  }
  else {
    actionLogs.push({key: 'Error', value: 'Element variable not defined!'});
  }
  
  return {actionLogs, actionOutputs};
}

// write text to element if it is an input element
export function writeElementText(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // find the element input variable in the context
  const elementInput = action.inputs.find(value => value.originalName === 'Element');
  // find the text input variable in the context
  const textInput = action.inputs.find(value => value.originalName === 'Text');
  
  if (!elementInput) {
    actionLogs.push({key: 'Error', value: 'Element variable not defined!'});
    return {actionLogs, actionOutputs, fatal: true};
  }
  if (!textInput) {
    actionLogs.push({key: 'Error', value: 'Text variable not defined!'});
    return {actionLogs, actionOutputs, fatal: true};
  }
  
  // get the element label from the context
  const elementLabel = (context[elementInput.name] as string).split('_')[1];
  // get the element from the dom
  const element = document.querySelector(`[${elementLabel}]`);
  // get the text from the context
  const text = context[textInput.name] as string;
  // check if the element is an input element
  const isInputElement = element instanceof HTMLInputElement;
  // if the element is an input element, set the value to the text
  if (isInputElement) {
    element.value = text;
    // get the result output variable in the context
    const isInputOutput = action.outputs.find(value => value.originalName === 'Is Input');
    if (isInputOutput) {
      actionOutputs[isInputOutput.name] = isInputElement;
    }
    else {
      actionLogs.push({key: 'Warning', value: 'Is Input variable not defined!'});
    }
  }
  else {
    actionLogs.push({key: 'Error', value: 'Element is not an input element!'});
  }
  
  return {actionLogs, actionOutputs};
}

// Get the elements that matches the query string
export function findElementsBySelector(action: Action, context: Record<string, unknown>, tabId: number) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  // find the selector input variable in the context
  const selectorInput = action.inputs.find(value => value.originalName === 'Selector');
  // if the selector or tab input is not found, return an empty object
  if (!selectorInput) {
    actionLogs.push({key: "Error", value: "Selector input variable undefined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }
  
  // get the selector from the context
  const selector = context[selectorInput.name] as string;
  
  // get the matching elements
  const elements = document.querySelectorAll(selector);
  
  // get a unique label to track all found elements
  const label = createUniqueElementLabel();
  elements.forEach(element => element.setAttribute(label, ""));
  // todo: remove this in the future, for testing only
  // change each element border color to red
  const results: HTMLElement[] = []
  elements.forEach(element => results.push(<HTMLElement>element));
  results.forEach(element => element.style.border = '3px solid red');
  
  // find the output variables
  const elementsOutput = action.outputs.find(value => value.originalName === "Elements");
  const countOutput = action.outputs.find(value => value.originalName === "Count");
  
  if (elementsOutput) {
    actionOutputs.set(elementsOutput, `${tabId}_${label}`);
    actionLogs.push({key: "Success", value: `${elements.length} Elements saved`})
  }
  else {
    actionLogs.push({key: "Warning", value: "Elements output variable isn't defined!"});
  }
  
  if (countOutput) {
    actionOutputs.set(countOutput, elements.length);
  } else {
    actionLogs.push({key: "Warning", value: "Count output variable isn't defined!"})
  }
  
  return {actionLogs, actionOutputs};
}

// Get the first element that matches the query string
export function findElementBySelector(action: Action, context: Record<string, unknown>, tabId: number) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  // find the selector input variable in the context
  const selectorInput = action.inputs.find(value => value.originalName === 'Selector');
  // if the selector or tab input is not found, return an empty object
  if (!selectorInput) {
    actionLogs.push({key: "Error", value: "Selector input variable undefined!"});
    return {actionLogs, actionOutputs, fatal: true};
  }

  // get the selector from the context
  const selector = context[selectorInput.name] as string;

  // get the matching elements
  const element = document.querySelector(selector);
  console.log(`Element found: ${element}`);

  // get a unique label to track all found elements
  const label = createUniqueElementLabel();
  console.log(`Element label: ${label}`);
  if (element)
    element.setAttribute(label, "");
  // todo: remove this in the future, for testing only
  // change the element border color to red
  (<HTMLElement>element).style.border = '3px solid red';

  // find the output variables
  const elementOutput = action.outputs.find(value => value.originalName === "Element");

  if (elementOutput) {
    actionOutputs.set(elementOutput, `${tabId}_${label}`);
    actionLogs.push({key: "Success", value: "Element saved"})
  }
  else {
    actionLogs.push({key: "Warning", value: "Element output variable isn't defined!"});
  }
  
  return {actionLogs, actionOutputs};
}
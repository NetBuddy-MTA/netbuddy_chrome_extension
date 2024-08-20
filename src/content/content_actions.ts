// Press the parameter element
import {Action, Variable} from "../shared/data.ts";
import {createUniqueElementLabel} from "./utils.ts";

function CreateEmptyResult(): {actionLogs: {key: string, value: string}[], actionOutputs: Map<Variable, unknown>} {
  return {actionLogs: [], actionOutputs: new Map()};
}

export function clickElement(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // find the element input variable in the context
  const elementInput = action.inputs.find(value => value.originalName === 'Element');
  if (elementInput) {
    // get the element from the context
    const element = context[elementInput.name] as HTMLElement;
    // click the element
    element.click();
  }
  else {
    actionLogs.push({key: 'Error', value: 'Element variable not defined!'});
  }
  
  return {actionLogs, actionOutputs, modifiedContext: context};
}

// read the text contents of the element
export function readElementText(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // find the element input variable in the context
  const elementInput = action.inputs.find(value => value.originalName === 'Element');
  if (elementInput) {
    // get the element from the context
    const element = context[elementInput.name] as HTMLElement;
    const content = element instanceof HTMLInputElement ? element.value : element.innerText;
    // get the text output variable in the context
    const textOutput = action.outputs.find(value => value.originalName === 'Element Text');
    if (textOutput) {
      actionOutputs.set(textOutput, content);
      context[textOutput.name] = content;
    } 
    else {
      actionLogs.push({key: 'Warning', value: 'Element Text variable not defined!'});
    }
  }
  else {
    actionLogs.push({key: 'Error', value: 'Element variable not defined!'});
  }
  
  return {actionLogs, actionOutputs, modifiedContext: context};
}

// write text to element if it is an input element
export function writeElementText(action: Action, context: Record<string, unknown>) {
  // initialize the action logs and outputs
  const {actionLogs, actionOutputs} = CreateEmptyResult();
  
  // find the element input variable in the context
  const selectorInput = action.inputs.find(value => value.originalName === 'Selector');
  // find the index input variable in the context
  const indexInput = action.inputs.find(value => value.originalName === 'Index');
  // find the text input variable in the context
  const textInput = action.inputs.find(value => value.originalName === 'Text');
  
  if (selectorInput && indexInput && textInput) {
    // get the index from the context
    const index = JSON.parse(context[indexInput.name] as string) as number;
    // get the elements matching the selector
    const elements = findElementsBySelector(action, context);
    if (elements.length + 1 < index) {
      actionLogs.push({key: 'Error', value: 'Index out of range!'});
      return {actionLogs, actionOutputs, modifiedContext: context, fatal: true};
    }
    // get the element from the context
    const element = elements[index - 1];
    // get the text from the context
    const text = context[textInput.name] as string;
    // check if the element is an input element
    const result = element instanceof HTMLInputElement;
    // if the element is an input element, set the value to the text
    if (result) {
      element.value = text;
      // get the result output variable in the context
      const isInputOutput = action.outputs.find(value => value.originalName === 'Is Input');
      if (isInputOutput) {
        actionOutputs.set(isInputOutput, result);
        context[isInputOutput.name] = result;
      }
      else {
        actionLogs.push({key: 'Warning', value: 'Is Input variable not defined!'});
      }
    }
    else {
      actionLogs.push({key: 'Error', value: 'Element is not an input element!'});
    }
  }
  else {
    actionLogs.push({key: 'Error', value: 'Not all input variables are defined!'});
  }
  
  return {actionLogs, actionOutputs, modifiedContext: context};
}

// Get the elements that matches the query string
export function findElementsBySelector(action: Action, context: Record<string, unknown>) {
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
  const selector = JSON.parse(context[selectorInput.name] as string) as string;
  
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
    actionOutputs.set(elementsOutput, label);
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
export function findElementBySelector(action: Action, context: Record<string, unknown>) {
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
  const selector = JSON.parse(context[selectorInput.name] as string) as string;

  // get the matching elements
  const element = document.querySelector(selector);

  // get a unique label to track all found elements
  const label = createUniqueElementLabel();
  if (element)
    element.setAttribute(label, "");
  // todo: remove this in the future, for testing only
  // change the element border color to red
  (<HTMLElement>element).style.border = '3px solid red';

  // find the output variables
  const elementOutput = action.outputs.find(value => value.originalName === "Element");

  if (elementOutput) {
    actionOutputs.set(elementOutput, label);
    actionLogs.push({key: "Success", value: "Element saved"})
  }
  else {
    actionLogs.push({key: "Warning", value: "Element output variable isn't defined!"});
  }

  return {actionLogs, actionOutputs};
}
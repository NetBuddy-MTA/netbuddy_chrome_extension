// Press the parameter element
import {Action} from "../shared/data.ts";

export function clickElement(action: Action, context: Record<string, unknown>) {
  // find the element input variable in the context
  const elementInput = action.inputs.find(value => value.originalName === 'Element');
  if (elementInput) {
    // get the element from the context
    const element = context[elementInput.name] as HTMLElement;
    // click the element
    element.click();
  }
  return {};
}

// read the text contents of the element
export function readElementText(action: Action, context: Record<string, unknown>) {
  // find the element input variable in the context
  const elementInput = action.inputs.find(value => value.originalName === 'Element');
  if (elementInput) {
    // get the element from the context
    const element = context[elementInput.name] as HTMLElement;
    const content = element instanceof HTMLInputElement ? element.value : element.innerText;
    // get the text output variable in the context
    const textOutput = action.outputs.find(value => value.originalName === 'Element Text');
    return {...(textOutput && {[textOutput.name]: content})};
  }
  return {};
}

// write text to element if it is an input element
export function writeElementText(action: Action, context: Record<string, unknown>) {
  // find the element input variable in the context
  const elementInput = action.inputs.find(value => value.originalName === 'Element');
  // find the text input variable in the context
  const textInput = action.inputs.find(value => value.originalName === 'Text');
  if (elementInput && textInput) {
    // get the element from the context
    const element = context[elementInput.name] as HTMLElement;
    // get the text from the context
    const text = context[textInput.name] as string;
    // check if the element is an input element
    const result = element instanceof HTMLInputElement;
    // if the element is an input element, set the value to the text
    if (result) {
      element.value = text;
    }
    
    // get the result output variable in the context
    const isInputOutput = action.outputs.find(value => value.originalName === 'Is Input');
    return {...(isInputOutput && {[isInputOutput.name]: result})};
  }
  return {};
}

// Get the elements that matches the query string
export function findElementsBySelector(action: Action, context: Record<string, unknown>) {
  // find the selector input variable in the context
  const selectorInput = action.inputs.find(value => value.originalName === 'Selector');
  // if the selector or tab input is not found, return an empty object
  if (!selectorInput) return [];
  // get the selector from the context
  const selector = JSON.parse(context[selectorInput.name] as string) as string;
  // get the matching elements
  const elements = document.querySelectorAll(selector);
  const results: HTMLElement[] = [];
  elements.forEach(element => results.push(<HTMLElement>element));
  // todo: remove this, for testing only
  console.log(results);
  // change each element border color to red
  results.forEach((element) => {
    element.style.border = '3px solid red';
  });
  return results;
}

// Get the first element that matches the query string
export function findElementBySelector(action: Action, context: Record<string, unknown>) {
  const [first] = findElementsBySelector(action, context);
  return first;
}
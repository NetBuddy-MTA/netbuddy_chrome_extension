// Press the parameter element
import {Action} from "../shared/data.ts";

export function clickElement(action: Action, context: Map<string, unknown>) {
  // find the element input variable in the context
  const elementInput = action.inputs.find(value => value.originalName === 'Element');
  if (elementInput) {
    // get the element from the context
    const element = context.get(elementInput.name) as HTMLElement;
    // click the element
    element.click();
  }
  return {};
}

// read the text contents of the element
export function readElementText(action: Action, context: Map<string, unknown>) {
  // find the element input variable in the context
  const elementInput = action.inputs.find(value => value.originalName === 'Element');
  if (elementInput) {
    // get the element from the context
    const element = context.get(elementInput.name) as HTMLElement;
    const content = element instanceof HTMLInputElement ? element.value : element.innerText;
    // get the text output variable in the context
    const textOutput = action.outputs.find(value => value.originalName === 'Element Text');
    return {...(textOutput && {[textOutput.name]: content})};
  }
  return {};
}

// write text to element if it is an input element
export function writeElementText(action: Action, context: Map<string, unknown>) {
  // find the element input variable in the context
  const elementInput = action.inputs.find(value => value.originalName === 'Element');
  // find the text input variable in the context
  const textInput = action.inputs.find(value => value.originalName === 'Text');
  if (elementInput && textInput) {
    // get the element from the context
    const element = context.get(elementInput.name) as HTMLElement;
    // get the text from the context
    const text = context.get(textInput.name) as string;
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

// Get the elements that match the xpath query
export function getElementsByXPath(xpath: string, storeResult?: string) {
  console.log("getting elements by xpath", xpath);
  const elements = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
  const results = [];
  let element = elements.iterateNext();
  while (element) {
    results.push(<HTMLElement>element);
    element = elements.iterateNext();
  }
  // todo: remove this, for testing only
  console.log(results);
  // change each element border color to red
  results.forEach((element) => {
    element.style.border = '3px solid red';
  });

  storeResult && chrome.storage.local.set({storeResult: results});
  return results;
}
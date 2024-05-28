import {Selector} from "../shared/data.ts";

// listener for messages from extension
chrome.runtime.onMessage.addListener(message => {
  if (message as string && message === 'StartGetSelector') getXPathForElement();
  if (message as string && message === 'StopGetSelector') removeListener();
});

// Get the XPath for the element clicked
export function getXPathForElement() {
  document.body.style.cursor = 'crosshair';
  document.addEventListener('contextmenu', handleClick);
}

// handle click event
async function handleClick(event: MouseEvent) {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  removeListener();
  const selector = getElementSelector(element);
  if (selector) {
    await chrome.runtime.sendMessage(selector);
    await chrome.runtime.sendMessage('StopGetSelector');
  }
}

// doing all the things that need doing when removing listener
function removeListener() {
  document.removeEventListener('contextmenu', handleClick);
  document.body.style.cursor = 'default';
}

// get the selector for this element
function getElementSelector(element: Element | null): Selector | null {
  if (!element) return null;
  
  const selector: Selector = {
    id: "",
    name: "",
    url: new URL(location.href).origin,
    stages: []
  };

  // build selector from the element
  for (; element && element.nodeType == Node.ELEMENT_NODE; element = element.parentElement) {
    const tag = (element.prefix ? element.prefix + ":" : "") + element.localName;
    
    // get all attributes of the element into maps
    const attrs = [...element.attributes];
    const attributes = attrs.reduce((acc, attr) => {
      acc.set(attr.name, attr.value);
      return acc;
    }, new Map<string, string>);
    const useAttributes = attrs.reduce((acc, attr) => {
      if (attr.name === "id") acc.set(attr.name, true);
      else acc.set(attr.name, false);
      return acc;
    }, new Map<string, boolean>);
    
    selector.stages.unshift({
      tag,
      inUse: true,
      attributes,
      useAttributes 
    });
  }
  
  // set the inUse flag for each stage (from the last element with an id to the end)
  let use = true;
  for (let i = selector.stages.length - 1; i >= 0; i--) {
    selector.stages[i].inUse = use;
    if (use && selector.stages[i].attributes.has("id")) use = false;
  }
  
  return selector;
}
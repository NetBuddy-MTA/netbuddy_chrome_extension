import {Selector} from "../shared/data.ts";
import {addDebugRects} from "./utils.ts";

chrome.storage.local.onChanged.addListener(async (changes) => {
  if ("createSelector" in changes) {
    if (changes.createSelector.newValue && !changes.createSelector.oldValue) await getXPathForElement();
    else if (!changes.createSelector.newValue && changes.createSelector.oldValue) await removeListener();
  }
})

// listener for messages from extension
chrome.runtime.onMessage.addListener(async message => {
  if (message as string && message === 'StartGetSelector') await getXPathForElement();
  if (message as string && message === 'StopGetSelector') await removeListener();
  if (message.selector !== undefined && message.selector.id !== undefined && message.cropping !== undefined && message.dataUrl !== undefined) {
    await chrome.runtime.sendMessage({selector: {...message.selector, base64Image: await cropImage(message.cropping, message.dataUrl)}});
  }
});

let currentElement: Element | null = null;
let currentOverlay: HTMLElement | null = null;
// Get the XPath for the element clicked
const getXPathForElement = async () => {
  await chrome.storage.local.set({createSelector: false});
  document.body.style.cursor = 'crosshair';
  document.addEventListener('contextmenu', handleClick);
  document.documentElement.onmousemove = (event: MouseEvent) => {
    const [element] = document.elementsFromPoint(event.clientX, event.clientY).filter(e => e.className !== 'NetBuddyOverlayRect');
    // if the element is the same as the current element, do nothing
    if (element === currentElement || element === currentOverlay) return;
    // remove previous overlay if it exists
    if (currentOverlay instanceof HTMLElement) document.documentElement.removeChild(currentOverlay);
    // set new current element
    currentElement = element;
    if (element === undefined) return;
    // set new overlay
    [currentOverlay] = addDebugRects([element.getBoundingClientRect()]);
    currentOverlay.onclick = async () => {
      await removeListener();
      const selector = getElementSelector(element);
      if (selector) {
        await chrome.runtime.sendMessage({selector, cropping: element.getBoundingClientRect()});
        await chrome.runtime.sendMessage('StopGetSelector');
      }
    };
  };
}

// handle click event
const handleClick = async (event: MouseEvent) => {
  const element = document.elementFromPoint(event.clientX, event.clientY);
  if (element === null) return;
  await removeListener();
  const selector = getElementSelector(element);
  if (selector) {
    await chrome.runtime.sendMessage({selector, cropping: element.getBoundingClientRect()});
    await chrome.runtime.sendMessage('StopGetSelector');
  }
}

// doing all the things that need doing when removing listener
const removeListener = async () => {
  document.documentElement.onmousemove = null;
  document.removeEventListener('contextmenu', handleClick);
  document.body.style.cursor = 'default';
  await chrome.storage.local.set({createSelector: false});
  console.log('Selector creation stopped')
  console.log('Removing overlay:', currentOverlay);
  if (currentOverlay !== null) {
    if (currentOverlay.parentElement !== null)
      currentOverlay.parentElement.removeChild(currentOverlay);
    currentOverlay = null;
    currentElement = null;
  }
}

// get the selector for this element
const getElementSelector = (element: Element | null): Selector | null => {
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
      acc[attr.name] = attr.value;
      return acc;
    }, {} as { [key: string]: string });
    const useAttributes = attrs.reduce((acc, attr) => {
      acc[attr.name] = attr.name === "id";
      return acc;
    }, {} as { [key: string]: boolean });
    
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
    if (use && "id" in selector.stages[i].attributes) use = false;
  }
  
  return selector;
}

const cropImage = async (rect: DOMRect, dataUrl: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  const context = canvas.getContext('2d');
  const cropped = new Image();
  
  cropped.onload = () => {
    context!.drawImage(cropped, 
      rect.x * window.devicePixelRatio, rect.y * window.devicePixelRatio, 
      rect.width * window.devicePixelRatio, rect.height * window.devicePixelRatio, 
      0, 0, rect.width * window.devicePixelRatio, rect.height * window.devicePixelRatio);
  }
  cropped.src = dataUrl;
  
  await cropped.decode();
  
  return canvas.toDataURL();
}

chrome.storage.local.get('createSelector').then(result => {
  if ("createSelector" in result && result.createSelector) getXPathForElement();
});

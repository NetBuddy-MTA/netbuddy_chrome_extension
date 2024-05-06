type CSCommand = {
  command: string,
  storeResult?: string,
  url?: string,
  xpath_selector?: string,
  css_selector?: string,
  element?: HTMLElement
};

// adding listener for messages from extension
chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  if (message as CSCommand) {
    if (message.command === 'GetElementXPath')
      getXPathForElement(message.storeResult);

    else if (message.command === 'GetElementsByXPath')
      if (message.xpath_selector)
        sendResponse(getElementsByXPath(message.xpath_selector, message.storeResult));

    else if (message.command === 'PressElement')
      message.element && pressElement(message.element);

    else if (message.command === 'ReadElementText')
      message.element && sendResponse(readElementText(message.element, message.storeResult));

    else if (message.command === 'WriteElementText')
      message.element && sendResponse(writeElementText(message.element, message.storeResult));

    else
      sendResponse(null);
  }
});

// Get the XPath for the element clicked
function getXPathForElement(storeResult?: string) {
  document.body.style.cursor = 'crosshair';
  document.addEventListener('contextmenu', handleClick);

  // doing all the things that need doing when removing listener
  function removeListener() {
    document.removeEventListener('contextmenu', handleClick);
    document.body.style.cursor = 'default';
  }

  // handle click event
  async function handleClick(event: MouseEvent) {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    removeListener();
    let xpath = getElementXPath(element);
    if (xpath) {
      xpath = "/" + xpath;
      await navigator.clipboard.writeText(xpath);
    }
    storeResult && await chrome.storage.local.set({storeResult: xpath});
  }

  // Get the XPath for the element
  function getElementXPath(element: Element | null) : string | null {
    if (element && element.id)
      return getElementTreeXPath(element);
    // return '//*[@id="' + element.id + '"]';
    else
      return getElementTreeXPath(element);
  }

  // Get the tree XPath for the element
  function getElementTreeXPath(element: Element | null) : string | null {
    if (!element)
      return null;

    const paths: string[] = [];

    for (; element && element.nodeType == Node.ELEMENT_NODE; element = element.parentElement) {
      let index = 0;
      let hasFollowingSiblings = false;
      for (let sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
        if (sibling.nodeType == Node.DOCUMENT_TYPE_NODE)
          continue;

        if (sibling.nodeName == element.nodeName)
          ++index;
      }

      for (let sibling = element.nextSibling; sibling && !hasFollowingSiblings; sibling = sibling.nextSibling) {
        if (sibling.nodeName == element.nodeName)
          hasFollowingSiblings = true;
      }

      const tagName = (element.prefix ? element.prefix + ":" : "") + element.localName;
      const pathIndex = (index || hasFollowingSiblings ? "[" + (index + 1) + "]" : "");
      paths.splice(0, 0, tagName + pathIndex);
    }

    return paths.length ? "/" + paths.join("/") : null;
  }
}

// Get the elements that match the xpath query
function getElementsByXPath(xpath: string, storeResult?: string) {
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

// Press the parameter element
function pressElement(element: HTMLElement) {
  element.click();
}

// read the text contents of the element
function readElementText(element: HTMLElement, storeResult?: string) {
  const result = element.innerText;
  storeResult && chrome.storage.local.set({storeResult: result});
  return result;
}

// write text to element if it is an input element
function writeElementText(element: HTMLElement, text: string, storeResult?: string) {
  const result = element instanceof HTMLInputElement;
  storeResult && chrome.storage.local.set({storeResult: result});
  if (result) {
    element.value = text;
    return true;
  }
  return false;
}

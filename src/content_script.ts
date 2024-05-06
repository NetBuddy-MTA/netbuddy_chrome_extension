type CSCommand = {
  command: string,
  url?: string,
  xpath_selector?: string,
  css_selector?: string,
};

// adding listener for messages from extension
chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  if (message as CSCommand) {
    if (message.command === 'GetElementXPath')
      getXPathForElement();
    else if (message.command === 'GetElementsByXPath')
      if (message.xpath_selector)
        sendResponse(getElementsByXPath(message.xpath_selector));
    else
      sendResponse(null);
  }
});

function getXPathForElement() {
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
    await navigator.clipboard.writeText(getElementXPath(element) as string);
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
function getElementsByXPath(xpath: string) {
  const elements = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
  const results = [];
  let element = elements.iterateNext();
  while (element) {
    results.push(<Element>element);
    element = elements.iterateNext();
  }
  // todo: remove this, for testing only
  console.log(results);
  return results;
}
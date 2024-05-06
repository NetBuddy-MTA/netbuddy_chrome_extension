import {Command, CommandType} from "../types/Command.ts";

// add listener to receive the xpath query
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message as Command) {
    console.log("Received command:");
    console.log(message);

    if (message.command.type === CommandType.GetElementsByXPath && message.xpath_selector) {
      const elements = getElementsFromXPath(message.xpath_selector);
      sendResponse(elements);
      // todo: remove this, for testing only
      elements.map(element => (<HTMLElement>element).style.background = 'red')
    }
  }
});

// Get the elements that match the xpath query
function getElementsFromXPath(xpath: string) {
  const elements = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
  const results = [];
  let element = elements.iterateNext();
  while (element) {
    results.push(<Element>element);
    element = elements.iterateNext();
  }
  return results;
}
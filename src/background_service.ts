chrome.runtime.onMessage.addListener(async (msg, _, sendResponse) => {
  if (msg as string) {
    if (msg === 'create_new_tab') {
      sendResponse(await chrome.tabs.create({ url: 'https://www.google.com/' }));
    }
  }
  else {
    sendResponse("Message is not a string.");
  }
});
type BgCommand = {
  command: string,
  url?: string,
  tabId?: number
};

// keep alive
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

// add listener for messages from other scripts
chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  if (message as BgCommand) {
    if (message.command === 'CreateTab')
      sendResponse(await createTab(message.url));

    else if (message.command === 'NavigateToURL')
      if (message.url && message.tabId)
        sendResponse(await navigateToURL(message.tabId, message.url));
      else
        sendResponse(null);

    else if (message.command === 'CloseTab')
      if (message.tabId)
        sendResponse(await closeTab(message.tabId));
      else
        sendResponse(null);

    else
      console.log("Invalid command");
  }
});

// creates a new tab and returns the tab object
async function createTab(url?: string) {
  return await chrome.tabs.create({url});
}

// navigates to a URL in a tab
async function navigateToURL(tabId: number, url: string) {
  return await chrome.tabs.update(tabId, {url});
}

// closes a tab
async function closeTab(tabId: number) {
  return await chrome.tabs.remove(tabId);
}

// add context menu and listener for context menu click
const menuItems: {
  id: string;
  contexts: chrome.contextMenus.ContextType[];
  title: string
  onClick: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void;
}[] = [
  {
    id: 'netbuddy_get_element_xpath',
    title: 'Get XPath',
    contexts: ['all'],
    onClick: async (info, tab) => {
      if (info && tab && tab.id)
        await chrome.tabs.sendMessage(tab.id, {command: 'GetElementXPath'});
    }
  },
  {
    id: 'netbuddy_get_elements_by_xpath',
    title: 'Get Elements by XPath',
    contexts: ['all'],
    onClick: async (info, tab) => {
      if (info && tab && tab.id) {
        const query = await chrome.storage.local.get('xpath');
        if (query && query.xpath)
            await chrome.tabs.sendMessage(tab.id, {command: 'GetElementsByXPath', xpath_selector: query.xpath});
      }
    }
  }
];

chrome.runtime.onInstalled.addListener(() => {
  menuItems.forEach(item => {
    const {id, title, contexts} = item;
    const itemId = chrome.contextMenus.create({id, title, contexts});
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      info.menuItemId === itemId && item.onClick(info, tab);
    });
  });
});
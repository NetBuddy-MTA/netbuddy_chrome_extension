const enum BgCommandType {
  CreateTab,
  NavigateToURL,
  CloseTab
}

type BgCommand = {
  command: BgCommandType,
  url?: string,
  tabId?: number
};

chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  if (message as BgCommand) {
    switch (message.command) {
      case BgCommandType.CreateTab:
        sendResponse(await createTab(message.url));
        break;

      case BgCommandType.NavigateToURL:
        if (message.url && message.tabId)
          sendResponse(await navigateToURL(message.tabId, message.url));
        else
          sendResponse(null);
        break;

      case BgCommandType.CloseTab:
        if (message.tabId)
          sendResponse(await closeTab(message.tabId));
        else
          sendResponse(null);
        break;

      default:
        break;
    }
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
    id: 'netbuddy_xpath',
    title: 'Get XPath',
    contexts: ['all'],
    onClick: async (info, tab) => {
      if (info && tab && tab.id)
        await chrome.tabs.sendMessage(tab.id, {command: 'GetElementXPath'});
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
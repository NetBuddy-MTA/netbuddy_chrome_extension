type BgCommand = {
  command: string,
  storeResult?: string,
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
      sendResponse(await createTab(message.url, message.storeResult));

    else if (message.command === 'NavigateToURL')
      if (message.url && message.tabId)
        sendResponse(await navigateToURL(message.tabId, message.url, message.storeResult));
      else
        sendResponse(null);

    else
      console.log("Invalid command");
  }
});

// creates a new tab and returns the tab object
async function createTab(url?: string, storeResult?: string) {
  const result = await chrome.tabs.create({url});
  storeResult && await chrome.storage.local.set({storeResult: result});
  return result;
}

// navigates to a URL in a tab
async function navigateToURL(tabId: number, url: string, storeResult?: string) {
  const result = await chrome.tabs.update(tabId, {url});
  storeResult && await chrome.storage.local.set({storeResult: result});
  return result;
}

// define context menu items and onClick handler
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
        await chrome.tabs.sendMessage(tab.id, {command: 'GetElementXPath', storeResult: 'xpath'});
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
            await chrome.tabs.sendMessage(tab.id, {
              command: 'GetElementsByXPath',
              storeResult: 'elements',
              xpath_selector: query.xpath
            });
      }
    }
  },
  {
    id: 'netbuddy_create_new_tab',
    title: 'Create New Tab',
    contexts: ['all'],
    onClick: async (info, tab) => {
      const query = await chrome.storage.local.get('url');
      if (info && tab)
        await createTab(query.url, 'tab');
    }
  },
  {
    id: 'netbuddy_navigate_to_url',
    title: 'Navigate to URL',
    contexts: ['all'],
    onClick: async (info, tab) => {
      const query = await chrome.storage.local.get(['tab', 'url']);
      if (info && tab && query && query.url && query.tab)
        await navigateToURL(query.tab.tabId as number, query.url, 'tab');
    }
  }
];

// add context menu items
chrome.runtime.onInstalled.addListener(() => {
  menuItems.forEach(item => {
    const {id, title, contexts} = item;
    const itemId = chrome.contextMenus.create({id, title, contexts});
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      info.menuItemId === itemId && item.onClick(info, tab);
    });
  });
});
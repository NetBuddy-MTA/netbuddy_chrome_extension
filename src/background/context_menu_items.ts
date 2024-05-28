// define context menu items and onClick handler
export const menuItems: {
  id: string;
  contexts: chrome.contextMenus.ContextType[];
  title: string
  onClick: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void;
}[] = [
  {
    id: 'netbuddy_start_get_selector',
    title: 'Start Get Selector',
    contexts: ['all'],
    onClick: async (info, tab) => {
      if (info && tab && tab.id)
        await chrome.tabs.sendMessage(tab.id, 'StartGetSelector');
    }
  },
  {
    id: 'netbuddy_stop_get_selector',
    title: 'Stop Get Selector',
    contexts: ['all'],
    onClick: async (info, tab) => {
      if (info && tab && tab.id)
        await chrome.tabs.sendMessage(tab.id, 'StopGetSelector');
    }  
  },
];
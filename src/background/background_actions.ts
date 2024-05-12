// keep alive
import {ActionParams} from "./data.ts";
import Tab = chrome.tabs.Tab;

// creates a new tab and returns the tab object
// url?: string - the URL to navigate to
export async function createTab(params: ActionParams, context: Map<string, unknown>) {
  // get the url input variable if exists in context
  const urlInput = params.inputs.find(value => value.origName === 'url');
  let url;
  if (urlInput) {
    // get the url from the context
    const urlParam = context.get(urlInput.name);
    url = urlParam as string;
  }
  // create the tab
  const tab = await chrome.tabs.create({url});
  // get the tab output variable if exists in context
  const tabOutput = params.outputs.find(value => value.origName === 'tab');
  // store the tab in the context
  tabOutput && context.set(tabOutput.name, tab);
  return tab;
}

// navigates to a URL in a tab
export async function navigateToURL(params: ActionParams, context: Map<string, unknown>) {
  // get the tab input variable if exists in context
  const tabInput = params.inputs.find(value => value.origName === 'tab');
  if (!tabInput) return;
  // get the tab from the context
  const tab = context.get(tabInput.name) as Tab;
  // check if the tab is associated with a tab id
  if (!tab.id) return;
  // get the url input variable if exists in context
  const urlInput = params.inputs.find(value => value.origName === 'url');
  if (!urlInput) return;
  // get the url from the context
  const url = context.get(urlInput.name) as string;
  
  const result = await chrome.tabs.update(tab.id, {url});
  
  // get the tab output variable if exists in context
  const tabOutput = params.outputs.find(value => value.origName === 'tab');
  // store the tab in the context
  tabOutput && context.set(tabOutput.name, result);
  return result;
}

// define context menu items and onClick handler
// const menuItems: {
//   id: string;
//   contexts: chrome.contextMenus.ContextType[];
//   title: string
//   onClick: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void;
// }[] = [
//   {
//     id: 'netbuddy_get_element_xpath',
//     title: 'Get XPath',
//     contexts: ['all'],
//     onClick: async (info, tab) => {
//       if (info && tab && tab.id)
//         await chrome.tabs.sendMessage(tab.id, {command: 'GetElementXPath', storeResult: 'xpath'});
//     }
//   },
//   {
//     id: 'netbuddy_get_elements_by_xpath',
//     title: 'Get Elements by XPath',
//     contexts: ['all'],
//     onClick: async (info, tab) => {
//       if (info && tab && tab.id) {
//         const query = await chrome.storage.local.get('xpath');
//         if (query && query.xpath)
//             await chrome.tabs.sendMessage(tab.id, {
//               command: 'GetElementsByXPath',
//               storeResult: 'elements',
//               xpath_selector: query.xpath
//             });
//       }
//     }
//   },
//   {
//     id: 'netbuddy_create_new_tab',
//     title: 'Create New Tab',
//     contexts: ['all'],
//     onClick: async (info, tab) => {
//       const query = await chrome.storage.local.get('url');
//       if (info && tab)
//         await createTab(query.url, 'tab');
//     }
//   },
//   {
//     id: 'netbuddy_navigate_to_url',
//     title: 'Navigate to URL',
//     contexts: ['all'],
//     onClick: async (info, tab) => {
//       const query = await chrome.storage.local.get(['tab', 'url']);
//       if (info && tab && query && query.url && query.tab)
//         await navigateToURL(query.tab.tabId as number, query.url, 'tab');
//     }
//   }
// ];

// add context menu items
// chrome.runtime.onInstalled.addListener(() => {
//   menuItems.forEach(item => {
//     const {id, title, contexts} = item;
//     const itemId = chrome.contextMenus.create({id, title, contexts});
//     chrome.contextMenus.onClicked.addListener((info, tab) => {
//       info.menuItemId === itemId && item.onClick(info, tab);
//     });
//   });
// });
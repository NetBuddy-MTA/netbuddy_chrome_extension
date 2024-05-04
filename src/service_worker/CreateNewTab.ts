export default async (url: string) => {
  return await chrome.tabs.create({url: url});
}
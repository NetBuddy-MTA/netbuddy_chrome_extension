// initializes the alarm that tries to run a sequence from the queue every roughly 4 seconds
export const InitSequenceAlarm = (callback: () => void) => {
  chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason !== 'install') return;
    await chrome.alarms.create('netbuddy_run_alarm', {periodInMinutes: 1/16});
  });
  
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'netbuddy_run_alarm') {
      await chrome.storage.local.get([]); // keep alive
      callback();
    }
  });
}
/* global chrome */
import { getTodaySchedules } from './common';

const initialData = parseInitialDataText();
chrome?.storage?.local?.set({ 'data.initialData': initialData })
  .then(sendMessageToBackground);

function parseInitialDataText() {
  const scripts = document.body.getElementsByTagName('script');
  const filtered = Array.from(scripts).filter((s) => s.innerText.includes('oInitialData'));
  const text = filtered[0].innerText;

  return {
    userNo: text.match(/"userNo":"([0-9]+)"/)[1],
    instanceCode: text.match(/"instanceCode":"([0-9]+)"/)[1],
    defaultCalendarId: text.match(/"defaultCalendarId":"([A-Za-z0-9-_]+)"/)[1],
    userTimezone: text.match(/"userTimezone":"([A-Za-z/]+)"/)[1],
    serverUrl: text.match(/sURL = "([A-Za-z0-9:/.]+)"/)[1],
  };
}

const dataPollingIntervalSec = 60;
setInterval(sendMessageToBackground, dataPollingIntervalSec * 1_000);

async function sendMessageToBackground() {
  const nextTodaySchedules = await getTodaySchedules({ sameOrigin: true });
  await chrome?.runtime?.sendMessage({ schedules: nextTodaySchedules });
  console.info('done sending message', nextTodaySchedules);
}

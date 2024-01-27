/* global chrome */
import { getTodaySchedules } from './common';

const initialData = parseInitialDataText();
console.log('data: ', initialData);

chrome?.runtime?.sendMessage({ initialData });

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

sendMessageToBackground();

const dataPollingIntervalSec = 60;
setInterval(sendMessageToBackground, dataPollingIntervalSec * 1_000);

async function sendMessageToBackground() {
  const nextTodaySchedules = await getTodaySchedules(initialData, { sameOrigin: true });
  await chrome?.runtime?.sendMessage({ schedules: nextTodaySchedules });
  console.log('done sending message');
}

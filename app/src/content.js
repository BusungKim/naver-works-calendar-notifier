/* global chrome */
import { getTodaySchedules } from './common';

chrome?.storage?.local?.set({ 'data.origin': window.location.origin });

async function sendMessageToBackground() {
  const nextTodaySchedules = await getTodaySchedules();
  await chrome?.runtime?.sendMessage({ schedules: nextTodaySchedules });
  console.info('done sending schedules to the extension', nextTodaySchedules);
}
sendMessageToBackground();

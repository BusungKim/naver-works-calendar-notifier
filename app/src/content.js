/* global chrome */
import { getTodaySchedules } from './common';

// Save the origin when content script loads
chrome?.storage?.local?.set({ 'data.origin': window.location.origin });

async function sendMessageToBackground() {
  const nextTodaySchedules = await getTodaySchedules();
  await chrome?.runtime?.sendMessage({ schedules: nextTodaySchedules });
  console.info('done sending message', nextTodaySchedules);
}
sendMessageToBackground();

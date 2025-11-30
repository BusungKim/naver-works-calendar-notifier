/* global chrome */
import { getTodaySchedules } from './common';

const origin = window.location.origin;

async function getUserInfoAndCache() {
  const userInfoRes = await fetch(`${origin}/api/userInfo`, {
    method: 'GET',
  });

  if (!userInfoRes.ok) {
    throw new Error('failed to get user info');
  }
  const userInfo = await userInfoRes.json();

  const { loginUserInstanceCode } = userInfo.userBasicInfo;
  const { timezoneId } = userInfo.userBasicInfo.userTimezoneInfo;
  const { userId } = userInfo.userBasicInfo;
  const { defaultCalendarId } = userInfo.userConfig;

  await chrome?.storage?.local?.set({
    'data.origin': origin,
    'data.loginUserInstanceCode': loginUserInstanceCode,
    'data.timezoneId': timezoneId,
    'data.userId': userId,
    'data.defaultCalendarId': defaultCalendarId,
    'data.serverTimezoneId': timezoneId,
  });
}

async function sendMessageToBackground() {
  await getUserInfoAndCache();
  const nextTodaySchedules = await getTodaySchedules();
  await chrome?.runtime?.sendMessage({ schedules: nextTodaySchedules });
  console.info('done sending schedules to the extension', nextTodaySchedules);
}
sendMessageToBackground();

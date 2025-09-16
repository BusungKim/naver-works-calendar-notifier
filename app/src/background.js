/* global chrome */

import { getTodaySchedules } from './common';
import { getFilteredSchedules } from './schedules';
import moment from 'moment-timezone';

chrome?.runtime?.onMessage?.addListener(async (request) => {
  if (!request.schedules) {
    return;
  }
  await cacheSchedules(request.schedules);
  await getFilteredSchedulesWithSideEffect(request.schedules);
});

async function cacheSchedules(schedules) {
  await chrome?.storage?.local?.set({ 'data.schedules': schedules, 'data.lastSyncedAt': Date.now() });
}

async function getServerTimezoneId() {
  const storageResult = await chrome?.storage?.local?.get(['data.serverTimezoneId']);
  return storageResult['data.serverTimezoneId'];
}

async function getFilteredSchedulesWithSideEffect(schedules) {
  const serverTimezoneId = await getServerTimezoneId();
  const nowTsSec = Math.floor(moment().valueOf() / 1000);

  const filteredSchedules = getFilteredSchedules(schedules, nowTsSec, serverTimezoneId);
  console.info('filteredSchedules: ', filteredSchedules);

  setBadgeText(filteredSchedules);
  setNextSchedule(filteredSchedules);

  return filteredSchedules;
}

function setBadgeText(schedules) {
  chrome?.action?.setBadgeText({ text: schedules.length.toString() });
  chrome?.action?.setBadgeTextColor({ color: 'white' });
  chrome?.action?.setBadgeBackgroundColor({ color: '#28C665' });
}

function setNextSchedule(schedules) {
  let nextSchedule = {};
  if (schedules.length > 0) {
    [nextSchedule] = schedules;
  }
  chrome?.storage?.local?.set({ 'data.nextSchedule': nextSchedule });
}

chrome?.alarms?.onAlarm?.addListener(handleAlarm);

export async function handleAlarm() {
  const pausedUntilTs = await getPausedUntilTs();
  if (pausedUntilTs) {
    const serverTimezoneId = await getServerTimezoneId();
    const pausedUntil = serverTimezoneId ? moment.tz(pausedUntilTs, serverTimezoneId) : moment(pausedUntilTs);

    if (moment().isSameOrBefore(pausedUntil)) {
      console.log('paused until', pausedUntil.local().format('LT'));
      return;
    }
  }

  const result = await chrome?.storage?.local?.get(['data.schedules', 'setting.sound', 'setting.notiRetention', 'setting.notiTimeWindow']);

  let schedules;
  try {
    schedules = await getTodaySchedules();
    await cacheSchedules(schedules);
  } catch (e) {
    // fallback
    console.warn('fallback getTodaySchedules', e);
    schedules = result['data.schedules'] || [];
  }
  schedules = await getFilteredSchedulesWithSideEffect(schedules);

  const options = {
    sound: result['setting.sound'],
    retention: result['setting.notiRetention'],
    timeWindow: result['setting.notiTimeWindow'],
  };
  await sendNotification(schedules, options);
}

async function getPausedUntilTs() {
  const pausedUntilResult = await chrome?.storage?.local?.get('data.pausedUntilTs');
  if (!pausedUntilResult) {
    return undefined;
  }
  return pausedUntilResult['data.pausedUntilTs'];
}

async function sendNotification(schedules, options) {
  const timeWindowMin = parseInt(options.timeWindow, 10);
  const serverTimezoneId = await getServerTimezoneId();

  const now = moment();
  const alarmNeededSchedules = schedules.filter((s) => {
    const scheduleStartMoment = serverTimezoneId ? moment.tz(s.fixedStartDate, serverTimezoneId) : moment(s.fixedStartDate);
    const tsDiff = scheduleStartMoment.diff(now, 'seconds');

    // eslint-disable-next-line yoda
    return -120 <= tsDiff && tsDiff < timeWindowMin * 60;
  });

  alarmNeededSchedules.forEach((schedule) => notify(schedule, options));
}

const soundAssetMap = {
  none: undefined,
  cp77: 'asset/sound/cp77.mp3',
  ping: 'asset/sound/ping.mp3',
  pikachu: 'asset/sound/pikachu.m4a',
};

export function notify(schedule, options) {
  const soundAssetPath = soundAssetMap[options.sound];
  if (soundAssetPath) {
    chrome?.offscreen?.createDocument({
      url: soundAssetPath,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'play music',
    });
  }

  const videoMeetingUrl = getVideoMeetingUrl(schedule);
  const wikiUrl = getWikiUrl(schedule);
  chrome?.notifications?.create(schedule.scheduleId, {
    title: schedule.content,
    message: videoMeetingUrl ? 'Click to join the meeting' : 'Time to attend the meeting',
    priority: 2,
    requireInteraction: options.retention === 'forever',
    type: 'basic',
    iconUrl: chrome?.runtime?.getURL('asset/icons8-calendar-96.png'),
  }, () => {
    chrome?.storage?.local?.set({
      'data.lastVideoMeetingUrl': videoMeetingUrl,
      'data.lastWikiUrl': wikiUrl,
    });
  });
}

export function getVideoMeetingUrl(schedule) {
  if (schedule.videoMeeting) {
    return schedule.videoMeeting.link;
  }

  if (schedule.place && schedule.place.includes('https://')) {
    return schedule.place;
  }

  const meetingUrlFromMemo = findMeetingUrlFromText(schedule.memo);
  if (meetingUrlFromMemo) {
    return meetingUrlFromMemo;
  }

  return undefined;
}

export function getWikiUrl(schedule) {
  const memo = schedule.memo || '';
  const wikiUrlMatches = memo.match(wikiRegex);
  if (wikiUrlMatches) {
    return wikiUrlMatches[0];
  }
  return undefined;
}

const zoomRegex = /(https:\/\/.*\.zoom\.us\/[^\s()]+)/g;
const worksRegex = /https:\/\/works\.do\/.*/g;
const wikiRegex = /https:\/\/\S*wiki[^\s()]+/g;

function findMeetingUrlFromText(text = '') {
  const zoomMatches = text.match(zoomRegex);
  if (zoomMatches) {
    return zoomMatches[0];
  }

  const worksMatches = text.match(worksRegex);
  if (worksMatches) {
    return worksMatches[0];
  }

  return undefined;
}

chrome?.notifications?.onClicked?.addListener(async (notificationId) => {
  const storageResult = await chrome?.storage?.local?.get(['data.lastVideoMeetingUrl', 'data.lastWikiUrl']);
  const lastWikiUrl = storageResult['data.lastWikiUrl'];
  if (lastWikiUrl) {
    openTab(lastWikiUrl);
  }
  const lastVideoMeetingUrl = storageResult['data.lastVideoMeetingUrl'];
  if (lastVideoMeetingUrl) {
    openTab(lastVideoMeetingUrl);
  }

  chrome?.notifications?.clear(notificationId);
  postCloseNotification();
});

chrome?.notifications?.onClosed?.addListener(() => {
  postCloseNotification();
});

export function openTab(url) {
  if (url) {
    chrome?.tabs?.create({ url, active: true });
  }
}

function postCloseNotification() {
  chrome?.offscreen?.closeDocument();
  chrome?.storage?.local?.set({ 'data.pausedUntilTs': Date.now() + 1000 * 60 * 5 });
  chrome?.storage?.local?.remove(['data.lastVideoMeetingUrl', 'data.lastWikiUrl']);
}

chrome?.runtime?.onInstalled.addListener(async () => {
  const data = await chrome?.storage?.local?.get('setting.sound');
  if (!data['setting.sound']) {
    chrome?.storage?.local?.set({
      'setting.sound': 'none',
      'setting.notiRetention': 'forever',
      'setting.notiTimeWindow': 1,
    });
  }

  const alarmForPolling = await chrome?.alarms?.get('schedule-polling');
  if (!alarmForPolling) {
    chrome?.alarms?.create('schedule-polling', {
      delayInMinutes: 0,
      periodInMinutes: 1,
    });
  }
  handleAlarm();
});

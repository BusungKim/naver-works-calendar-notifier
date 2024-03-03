/* global chrome */

import { getTodaySchedules } from './common';
import { getFilteredSchedules } from './schedules';
import moment from 'moment';

chrome?.runtime?.onMessage.addListener(async (request) => {
  if (!request.schedules) {
    return;
  }
  cacheSchedules(request.schedules);
  getFilteredSchedulesWithSideEffect(request.schedules);
});

async function cacheSchedules(schedules) {
  await chrome?.storage?.local.set({ 'data.schedules': schedules, 'data.lastSyncedAt': Date.now() });
}

function getFilteredSchedulesWithSideEffect(schedules) {
  const nowTsSec = Math.floor(Date.now() / 1000);
  const filteredSchedules = getFilteredSchedules(schedules, nowTsSec);
  console.info('filteredSchedules: ', filteredSchedules);

  setBadgeText(filteredSchedules);
  setUpcomingSchedule(filteredSchedules);

  return filteredSchedules;
}

function setBadgeText(schedules) {
  chrome?.action.setBadgeText({ text: schedules.length.toString() });
  chrome?.action.setBadgeTextColor({ color: 'white' });
  chrome?.action.setBadgeBackgroundColor({ color: '#28C665' });
}

function setUpcomingSchedule(schedules) {
  let upcomingSchedule = {};
  if (schedules.length > 0) {
    [upcomingSchedule] = schedules;
  }
  chrome?.storage?.local.set({ 'data.upcomingSchedule': upcomingSchedule });
}

chrome?.alarms?.onAlarm.addListener(handleAlarm);

export async function handleAlarm() {
  const pausedUntilTs = await getPausedUntilTs();
  if (pausedUntilTs && Date.now() <= pausedUntilTs) {
    console.log('paused until', moment(pausedUntilTs).format('YYYY-MM-DD HH:mm:ss'));
    return;
  }

  const result = await chrome?.storage.local.get(['data.initialData', 'data.schedules', 'setting.sound', 'setting.notiRetention', 'setting.notiTimeWindow']);

  let schedules;
  try {
    schedules = await getTodaySchedules({ sameOrigin: false });
    cacheSchedules(schedules);
  } catch (e) {
    // fallback
    console.warn('fallback getTodaySchedules', e);
    schedules = result['data.schedules'] || [];
  }
  schedules = getFilteredSchedulesWithSideEffect(schedules);

  const options = {
    sound: result['setting.sound'],
    retention: result['setting.notiRetention'],
    timeWindow: result['setting.notiTimeWindow'],
  };
  sendNotification(schedules, options);
}

async function getPausedUntilTs() {
  const pausedUntilResult = await chrome?.storage?.local.get('setting.pausedUntil');
  if (!pausedUntilResult) {
    return undefined;
  }
  return pausedUntilResult['setting.pausedUntil'];
}

function sendNotification(schedules, options) {
  const timeWindowMin = parseInt(options.timeWindow, 10);

  const nowTsSec = Math.floor(Date.now() / 1000);
  const alarmNeededSchedules = schedules.filter((s) => {
    const tsDiff = Math.floor(Date.parse(s.fixedStartDate) / 1000) - nowTsSec;

    if (timeWindowMin === 0) {
      return tsDiff <= 0 && tsDiff > -60;
    }
    return tsDiff >= 0 && tsDiff < timeWindowMin * 60;
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
  chrome?.notifications.create(schedule.scheduleId, {
    title: schedule.content,
    message: videoMeetingUrl ? 'Click to join the meeting' : 'Time to attend the meeting',
    priority: 2,
    requireInteraction: options.retention === 'forever',
    type: 'basic',
    iconUrl: chrome?.runtime?.getURL('asset/icons8-calendar-96.png'),
  }, () => {
    chrome?.storage?.local.set({ 'data.lastVideoMeetingUrl': videoMeetingUrl });
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

const zoomRegex = /(https:\/\/.*\.zoom\.us\/[^\s]+)/g;
const worksRegex = /https:\/\/works\.do\/.*/g;

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

chrome?.notifications.onClicked.addListener(async (notificationId) => {
  const storageResult = await chrome?.storage?.local.get('data.lastVideoMeetingUrl');
  const lastVideoMeetingUrl = storageResult['data.lastVideoMeetingUrl'];
  if (lastVideoMeetingUrl) {
    openVideoMeeting(lastVideoMeetingUrl);
  }

  chrome?.notifications.clear(notificationId);
  postCloseNotification();
});

chrome?.notifications?.onClosed.addListener(() => {
  postCloseNotification();
});

export function openVideoMeeting(videoMeetingUrl) {
  if (videoMeetingUrl) {
    chrome?.tabs.create({ url: videoMeetingUrl, active: true });
  }
}

function postCloseNotification() {
  chrome?.offscreen?.closeDocument();
  chrome?.storage?.local.set({ 'setting.pausedUntil': Date.now() + 1000 * 60 * 3 });
}

chrome?.runtime?.onInstalled.addListener(async () => {
  const data = await chrome?.storage?.local.get('setting.sound');
  if (!data['setting.sound']) {
    chrome?.storage?.local.set({
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

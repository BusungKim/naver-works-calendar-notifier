/* global chrome */

chrome?.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const uniqueSchedules = request.schedules.filter((schedule) => !schedule.parentScheduleId);

  chrome?.storage?.local.set({ 'data.schedules': uniqueSchedules }).then(() => {
    console.log('onMessage - set data.schedules');
    setBadgeText(uniqueSchedules);
  });
});

function setBadgeText(schedules) {
  chrome?.action.setBadgeText({ text: schedules.length.toString() });
  chrome?.action.setBadgeTextColor({ color: 'white' });
  chrome?.action.setBadgeBackgroundColor({ color: '#28C665' });
}

chrome?.alarms.onAlarm.addListener(handleAlarm);

export async function handleAlarm() {
  const pausedUntilTs = await getPausedUntilTs();
  console.log('pausedUntil: ', pausedUntilTs);

  if (pausedUntilTs && Date.now() <= pausedUntilTs) {
    console.log('pausedUntil is set so skip');
    return;
  }

  chrome?.storage.local.get(['data.schedules', 'setting.sound', 'setting.notiRetention', 'setting.notiTimeWindow'])
    .then((result) => {
      const schedules = result['data.schedules'] || [];
      const options = {
        sound: result['setting.sound'],
        retention: result['setting.notiRetention'],
        timeWindow: result['setting.notiTimeWindow'],
      };
      console.log('onAlarm: ', schedules, options);
      sendNotification(schedules, options);
    });
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
  const alarmNeededSchedules = schedules
    .filter((s) => {
      const startDate = s.repeatDateList?.length > 0 ? s.repeatDateList[0].startDate : s.startDate;
      const tsDiff = Math.floor(Date.parse(startDate) / 1000) - nowTsSec;
      return tsDiff >= 0 && tsDiff < timeWindowMin * 60;
    });

  alarmNeededSchedules.forEach((schedule) => notify(schedule, options));
}

const soundAssetMap = {
  none: undefined,
  cp77: 'asset/offscreen/sound/cp77.mp3',
  ping: 'asset/offscreen/sound/ping.wav',
};

function notify(schedule, options) {
  console.log('notify - ', options);

  const soundAssetPath = soundAssetMap[options.sound];
  if (soundAssetPath) {
    chrome?.offscreen?.createDocument({
      url: soundAssetPath,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'play music',
    });
  }

  const videoMeetingUrl = getMeetingUrl(schedule);
  chrome?.notifications.create(schedule.scheduleId, {
    title: schedule.content,
    message: videoMeetingUrl ? 'Click to join the meeting' : 'Time to attend the meeting',
    priority: 2,
    requireInteraction: options.retention === 'forever',
    type: 'basic',
    iconUrl: chrome?.runtime.getURL('asset/icons8-calendar-96.png'),
  });
  chrome?.notifications.onClicked.addListener((notificationId) => {
    console.log('onClicked: ', notificationId);
    chrome?.offscreen?.closeDocument();
    if (videoMeetingUrl) {
      chrome?.tabs.create({ url: videoMeetingUrl, active: true });
    }
    chrome?.notifications.clear(notificationId);
    chrome?.storage?.local.set({ 'setting.pausedUntil': Date.now() + 1000 * 60 * 3 });
  });
}

chrome?.notifications?.onClosed.addListener((notificationId) => {
  console.log('onClosed: ', notificationId);
  chrome?.offscreen?.closeDocument();
});

function getMeetingUrl(schedule) {
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

chrome?.runtime.onInstalled.addListener(() => {
  console.log('onInstalled');
  chrome?.storage?.local.set({
    'setting.sound': 'none',
    'setting.notiRetention': 'forever',
    'setting.notiTimeWindow': 1,
  });
  chrome?.alarms.get('schedule-polling', (alarm) => {
    console.log('alarm: ', alarm);
    if (!alarm) {
      console.log('no alarm is set so created one');
      chrome?.alarms.create('schedule-polling', {
        delayInMinutes: 0,
        periodInMinutes: 1,
      });
    }
  });
});

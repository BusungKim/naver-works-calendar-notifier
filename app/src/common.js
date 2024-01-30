/* global chrome */
import moment from 'moment/moment';

export async function getTodaySchedules(options) {
  const r = await chrome?.storage?.local.get(['data.initialData']);
  const initialData = r['data.initialData'];
  if (!initialData) {
    throw new Error('no initial data');
  }

  const requestUrl = options.sameOrigin ? '/ajax/GetScheduleList' : `${initialData.serverUrl}/ajax/GetScheduleList`;
  const timeStamp = new Date().getTime();
  const scheduleQueryRange = [`${moment(timeStamp).format('YYYY-MM-DD HH:mm:ss')}`, `${moment(timeStamp).format('YYYY-MM-DD 23:59:59')}`];

  const res = await fetch(requestUrl, {
    body: makeRequestBody(initialData, scheduleQueryRange),
    method: 'post',
  });

  if (!res.ok) {
    throw new Error('failed to get today schedules');
  }
  const responseBody = await res.json();

  return responseBody.retScheduleList.returnValue;
}

function makeRequestBody(initialData, scheduleQueryRange = []) {
  const body = {
    calendarUidWithInstanceCodeList: [{
      calendarId: initialData.defaultCalendarId,
      instanceCode: initialData.instanceCode,
    }],
    startDate: scheduleQueryRange[0],
    endDate: scheduleQueryRange[1],
    userTimezone: initialData.userTimezone,
  };

  const formData = new FormData();
  formData.append('bo', JSON.stringify(body));
  formData.append('localUserId', initialData.userNo);

  return formData;
}

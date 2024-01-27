import moment from 'moment/moment';

export async function getTodaySchedules(initialData, options) {
  const timeStamp = new Date().getTime();
  const scheduleQueryRange = [`${moment(timeStamp).format('YYYY-MM-DD HH:mm:ss')}`, `${moment(timeStamp).format('YYYY-MM-DD 23:59:59')}`];

  let requestUrl = '/ajax/GetScheduleList';
  if (!options.sameOrigin) {
    requestUrl = `${initialData.serverUrl}/ajax/GetScheduleList`;
  }

  const res = await fetch(requestUrl, {
    body: makeRequestBody(initialData, scheduleQueryRange),
    method: 'post',
  });

  if (!res.ok) {
    return [];
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

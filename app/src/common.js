/* global chrome */
import moment from 'moment-timezone';

export async function getTodaySchedules() {
  const storageResult = await chrome?.storage?.local?.get([
    'data.origin',
    'data.loginUserInstanceCode',
    'data.timezoneId',
    'data.userId',
    'data.defaultCalendarId',
  ]);

  const origin = storageResult['data.origin'];
  const loginUserInstanceCode = storageResult['data.loginUserInstanceCode'];
  const timezoneId = storageResult['data.timezoneId'];
  const userId = storageResult['data.userId'];
  const defaultCalendarId = storageResult['data.defaultCalendarId'];

  if (!origin || !loginUserInstanceCode || !timezoneId || !userId || !defaultCalendarId) {
    throw new Error('No user info stored. Please visit the calendar page first.');
  }

  const now = moment().tz(timezoneId);
  const localStartDateTime = now.format('YYYY-MM-DD HH:mm:ss');
  const localEndDateTime = now.clone().format('YYYY-MM-DD 23:59:59');

  const body = {
    calendarUidWithInstanceCodeList: [{
      calendarId: defaultCalendarId,
      instanceCode: loginUserInstanceCode,
    }],
    startDate: localStartDateTime,
    endDate: localEndDateTime,
    userTimezone: timezoneId,
  };

  const formData = new FormData();
  formData.append('bo', JSON.stringify(body));
  formData.append('localUserId', userId);

  const res = await fetch(`${origin}/ajax/GetScheduleList`, {
    body: formData,
    method: 'post',
  });

  if (!res.ok) {
    throw new Error('failed to get today schedules');
  }
  const json = await res.json();
  return json.retScheduleList.returnValue;
}

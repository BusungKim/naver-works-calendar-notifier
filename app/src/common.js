/* global chrome */
import moment from 'moment-timezone';

export async function getTodaySchedules() {
  const storageResult = await chrome?.storage?.local?.get(['data.origin']);
  const origin = storageResult['data.origin'];

  if (!origin) {
    throw new Error('No origin stored. Please visit the calendar page first.');
  }

  // Get user info
  const userInfoRes = await fetch(`${origin}/api/userInfo`, {
    method: 'GET',
  });

  if (!userInfoRes.ok) {
    throw new Error('failed to get user info');
  }
  const userInfo = await userInfoRes.json();

  const loginUserInstanceCode = userInfo.userBasicInfo.loginUserInstanceCode;
  const timezoneId = userInfo.userBasicInfo.userTimezoneInfo.timezoneId;
  const userId = userInfo.userBasicInfo.userId;
  const defaultCalendarId = userInfo.userConfig.defaultCalendarId;

  // Build request body
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
  const json = await res.json()
  return json.retScheduleList.returnValue;
}


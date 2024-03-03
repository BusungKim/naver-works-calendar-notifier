/* global chrome */
import React from 'react';
import { Box, Button } from '@mui/material';
import { handleAlarm, notify } from '../background';

export function Debug() {
  return (
    <Box>
      <Button variant="contained" onClick={handleClickNotification}>Notification</Button>
      <Button variant="contained" onClick={handleClickTab}>Tab</Button>
      <Button variant="contained" onClick={handleAlarm}>Trigger Alarm</Button>
      <Button variant="contained" onClick={handleRequest}>Request</Button>
    </Box>
  );
}

async function handleRequest() {
  /*
  bo: {'calendarUidWithInstanceCodeList':[{'calendarId':'c_400309288_cb613baa-4925-4e22-b191-fd874c43b757','instanceCode':'23921'}],'startDate':'2024-01-27 19:10:26','endDate':'2024-01-27 23:59:59','userTimezone':'Asia/Seoul'}
  localUserId: 110002507710568
   */

  const formData = new FormData();
  // eslint-disable-next-line quotes
  formData.append('bo', "{\"calendarUidWithInstanceCodeList\":[{\"calendarId\":\"c_400309288_cb613baa-4925-4e22-b191-fd874c43b757\",\"instanceCode\":\"23921\"}],\"startDate\":\"2024-01-27 19:10:26\",\"endDate\":\"2024-01-27 23:59:59\",\"userTimezone\":\"Asia/Seoul\"}");
  formData.append('localUserId', 110002507710568);

  const res = await fetch('https://calendar.worksmobile.com/ajax/GetScheduleList', {
    method: 'POST',
    body: formData,
  });
  console.log('response: ', res);
}

function handleClickNotification() {
  chrome?.storage?.local.get('data.pausedUntilTs').then((result) => {
    console.log('pausedUntil: ', result['data.pausedUntilTs']);
  });

  chrome?.storage.local.get(['setting.sound', 'setting.notiRetention', 'setting.notiTimeWindow'])
    .then((result) => {
      notify({
        scheduleId: 'debug-schedule-id',
        content: '[DEBUG] This is title',
        videoMeeting: {
          link: 'https://naver.com',
        },
      }, {
        sound: result['setting.sound'],
        retention: result['setting.notiRetention'],
        timeWindow: result['setting.notiTimeWindow'],
      });
    });
}

function handleClickTab() {
  chrome?.tabs?.create({
    url: 'https://www.google.com',
    active: false,
  });
}

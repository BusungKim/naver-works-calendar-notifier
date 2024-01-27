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
    </Box>
  );
}

function handleClickNotification() {
  chrome?.storage?.local.get('setting.pausedUntil').then((result) => {
    console.log('pausedUntil: ', result['setting.pausedUntil']);
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

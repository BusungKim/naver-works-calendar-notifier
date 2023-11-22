/* global chrome */
import React from 'react';
import { Box, Button } from '@mui/material';
import { handleAlarm } from '../background';

export function Debug() {
  return (
    <Box>
      <Button variant="contained" onClick={handleClickNotification}>Notification</Button>
      <Button variant="contained" onClick={handleClickTab}>Tab</Button>
      <Button variant="contained" onClick={handleClickCp77Play}>Cp77 Play</Button>
      <Button variant="contained" onClick={handleClickPingPlay}>Ping Play</Button>
      <Button variant="contained" onClick={handleAlarm}>Trigger Alarm</Button>
    </Box>
  );
}

function handleClickNotification() {
  chrome?.storage?.local.get('setting.pausedUntil').then((result) => {
    console.log('pausedUntil: ', result['setting.pausedUntil']);
  });
  chrome?.notifications?.create('notinoti', {
    title: '[DEBUG] This is title',
    message: 'Click to join the meeting',
    requireInteraction: true,
    type: 'basic',
    iconUrl: chrome.runtime.getURL('asset/icons8-calendar-96.png'),
  });
}

function handleClickTab() {
  chrome?.tabs?.create({
    url: 'https://www.google.com',
    active: false,
  });
}

function handleClickCp77Play() {
  chrome?.offscreen?.closeDocument();
  chrome?.offscreen?.createDocument({
    url: 'asset/offscreen/cp77.html',
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'play music',
  });
}

function handleClickPingPlay() {
  chrome?.offscreen?.closeDocument();
  chrome?.offscreen?.createDocument({
    url: 'asset/offscreen/ping.html',
    reasons: ['AUDIO_PLAYBACK'],
    justification: 'play music',
  });
}

/* global chrome */
import {
  Box, IconButton, TextField,
} from '@mui/material';
import { Videocam } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { Debug } from './Debug';
import { CustomSelect } from './CustomSelect';
import { getVideoMeetingUrl, openVideoMeeting } from '../background';
import moment from 'moment';

export default function App() {
  const [sound, setSound] = useState('none');
  const [notiRetention, setNotiRetention] = useState('forever');
  const [notiTimeWindow, setNotiTimeWindow] = useState('0');
  const [upcomingSchedule, setUpcomingSchedule] = useState({});

  useEffect(() => {
    chrome?.storage?.local.get(['setting.sound', 'setting.notiRetention', 'setting.notiTimeWindow', 'data.upcomingSchedule'])
      .then((result) => {
        setSound(result['setting.sound']);
        setNotiRetention(result['setting.notiRetention']);
        setNotiTimeWindow(result['setting.notiTimeWindow']);
        setUpcomingSchedule(result['data.upcomingSchedule']);
      });
  }, []);

  function handleChangeSound(nextSound) {
    console.log('handleChangeSound: ', nextSound);
    chrome?.storage?.local.set({ 'setting.sound': nextSound }).then(() => {
      setSound(nextSound);
    });
  }

  function handleChangeNotiRetention(nextNotiRetention) {
    console.log('handleChangeNotiRetention: ', nextNotiRetention);
    chrome?.storage?.local.set({ 'setting.notiRetention': nextNotiRetention }).then(() => {
      setNotiRetention(nextNotiRetention);
    });
  }

  function handleChangeNotiTimeWindow(nextNotiTimeWindow) {
    console.log('handleChangeNotiTimeWindow: ', nextNotiTimeWindow);
    chrome?.storage?.local.set({ 'setting.notiTimeWindow': nextNotiTimeWindow }).then(() => {
      setNotiTimeWindow(nextNotiTimeWindow);
    });
  }

  function drawGoToMeetingIcon(schedule) {
    const videoMeetingUrl = getVideoMeetingUrl(schedule);
    return (
      <IconButton
        disabled={!videoMeetingUrl}
        size="large"
        color="primary"
        onClick={() => openVideoMeeting(videoMeetingUrl)}
      >
        <Videocam />
      </IconButton>
    );
  }

  return (
    <div className="container">
      {process.env.BUILD_VERSION && (
        <div style={{ textAlign: 'right', paddingRight: '8px' }}>
          {`v${process.env.BUILD_VERSION}`}
        </div>
      )}
      {process.env.LOCAL_BUILD && <Debug />}
      <Box style={{
        margin: 'auto',
        width: '250px',
      }}
      >
        <Box display="flex" alignItems="center" p={1}>
          <CustomSelect
            name="Sound"
            value={sound}
            onChange={(e) => handleChangeSound(e)}
            items={[
              { value: 'none', label: 'Off' },
              { value: 'cp77', label: 'Cyberpunk 2077' },
              { value: 'ping', label: 'Ping' },
              { value: 'pikachu', label: 'Pikachu' },
            ]}
          />
        </Box>
        <Box display="flex" alignItems="center" p={1}>
          <CustomSelect
            name="Notification Retention"
            value={notiRetention}
            onChange={(e) => handleChangeNotiRetention(e)}
            items={[
              { value: 'forever', label: 'Forever' },
              { value: 'transitory', label: 'Transitory' },
            ]}
          />
        </Box>
        <Box display="flex" alignItems="center" p={1}>
          <CustomSelect
            name="Notification Time Window"
            value={notiTimeWindow}
            onChange={(e) => handleChangeNotiTimeWindow(e)}
            items={[
              { value: 0, label: 'On Time' },
              { value: 1, label: '1 min' },
              { value: 2, label: '2 min' },
              { value: 3, label: '3 min' },
            ]}
          />
        </Box>
        <Box display="flex" alignItems="center" p={1}>
          <TextField
            id="outlined-disabled"
            label="Upcoming Meeting"
            size="small"
            disabled
            value={upcomingSchedule?.content || 'No meeting today 👋'}
            helperText={prettyUpcomingStartDate(upcomingSchedule?.startDate)}
          />
          {drawGoToMeetingIcon(upcomingSchedule)}
        </Box>
      </Box>
    </div>
  );
}

function prettyUpcomingStartDate(startDate) {
  if (!startDate) {
    return '';
  }

  const seconds = Math.floor((moment(startDate) - Date.now()) / 1000);
  if (seconds <= 0) {
    return 'Already started ⏰';
  }

  const hour = Math.floor(seconds / 3600);
  const minute = Math.ceil((seconds % 3600) / 60);

  return `Starting in ${hour > 0 ? `${hour}h ` : ' '}${minute}m ⏳`;
}

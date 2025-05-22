/* global chrome */
import {
  Box, FormControl, IconButton, TextField, Typography,
} from '@mui/material';
import { Description, Refresh, Videocam } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { Debug } from './Debug';
import { CustomSelect } from './CustomSelect';
import { getVideoMeetingUrl, getWikiUrl, openVideoMeeting } from '../background';
import moment from 'moment';

export default function App() {
  const [sound, setSound] = useState('none');
  const [notiRetention, setNotiRetention] = useState('forever');
  const [notiTimeWindow, setNotiTimeWindow] = useState('0');
  const [upcomingSchedule, setUpcomingSchedule] = useState({});
  const [lastSyncedAt, setLastSyncedAt] = useState(0);
  const [infoText, setInfoText] = useState('');

  useEffect(() => {
    async function init() {
      const result = await chrome?.storage?.local?.get(['setting.sound', 'setting.notiRetention', 'setting.notiTimeWindow', 'data.upcomingSchedule']);
      if (result) {
        setSound(result['setting.sound']);
        setNotiRetention(result['setting.notiRetention']);
        setNotiTimeWindow(result['setting.notiTimeWindow']);
        setUpcomingSchedule(result['data.upcomingSchedule']);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function updateLastSyncedAt() {
      const r = await chrome?.storage?.local?.get(['data.lastSyncedAt']) || {};
      setLastSyncedAt(r['data.lastSyncedAt'] || 0);
    }
    updateLastSyncedAt();
    setInterval(updateLastSyncedAt, 1_000);
  }, []);

  useEffect(() => {
    if (needRefresh(lastSyncedAt)) {
      setInfoText('👈 Need to sync schedules');
      return;
    }
    setInfoText(`Synced at ${moment(lastSyncedAt).format('LT')}`);
  }, [lastSyncedAt]);

  function handleChangeSound(nextSound) {
    console.log('handleChangeSound: ', nextSound);
    chrome?.storage?.local?.set({ 'setting.sound': nextSound }).then(() => {
      setSound(nextSound);
    });
  }

  function handleChangeNotiRetention(nextNotiRetention) {
    console.log('handleChangeNotiRetention: ', nextNotiRetention);
    chrome?.storage?.local?.set({ 'setting.notiRetention': nextNotiRetention }).then(() => {
      setNotiRetention(nextNotiRetention);
    });
  }

  function handleChangeNotiTimeWindow(nextNotiTimeWindow) {
    console.log('handleChangeNotiTimeWindow: ', nextNotiTimeWindow);
    chrome?.storage?.local?.set({ 'setting.notiTimeWindow': nextNotiTimeWindow }).then(() => {
      setNotiTimeWindow(nextNotiTimeWindow);
    });
  }

  async function handleClickRefresh() {
    const r = await chrome?.storage?.local?.get(['data.initialData']) || {};
    const initialData = r['data.initialData'] || {};

    if (!initialData.serverUrl) {
      setInfoText('Please open your calendar manually 📅');
      return;
    }
    chrome?.tabs?.create({ url: initialData.serverUrl, active: true });
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

  function drawWikiIcon(schedule) {
    const wikiUrl = getWikiUrl(schedule);
    return (
      <IconButton
        disabled={!wikiUrl}
        size="large"
        color="primary"
        onClick={() => {}}
      >
        <Description />
      </IconButton>
    );
  }

  function showVersionText() {
    const version = process.env.BUILD_VERSION;
    if (!version) {
      return undefined;
    }
    return (
      <div style={{ textAlign: 'right', paddingRight: '8px' }}>
        <a
          target="_blank"
          href={`https://github.com/BusungKim/naver-works-calendar-notifier/releases/tag/v${version}`}
          rel="noreferrer"
        >
          {`v${version}`}
        </a>
      </div>
    );
  }

  return (
    <div className="container">
      {showVersionText()}
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
            fullWidth
            value={upcomingSchedule?.content || 'No meeting today 👋'}
            helperText={prettyUpcomingStartDate(upcomingSchedule?.fixedStartDate)}
          />
        </Box>
        <Box display="flex" alignItems="center" mt={-1}>
          {drawGoToMeetingIcon(upcomingSchedule)}
          {drawWikiIcon(upcomingSchedule)}
          <IconButton
            size="large"
            disabled={!needRefresh(lastSyncedAt)}
            color={needRefresh(lastSyncedAt) ? 'error' : 'success'}
            onClick={() => handleClickRefresh()}
          >
            <Refresh />
          </IconButton>
          <Typography
            variant="caption"
            color="darkgray"
          >
            {infoText}
          </Typography>
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
  const minute = Math.floor((seconds % 3600) / 60);

  return `Starting in ${hour > 0 ? `${hour}h ` : ' '}${minute}m ⏳`;
}

function needRefresh(lastSyncedAt) {
  return Date.now() - lastSyncedAt > 10 * 60 * 1000;
}

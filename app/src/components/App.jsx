import {Box, Divider, Typography} from '@mui/material';
import {useEffect, useState} from "react";
import {CustomRadioGroup} from "./CustomRadioGroup";
import {Debug} from "./Debug";

export default function App() {
  const [sound, setSound] = useState('');
  const [notiRetention, setNotiRetention] = useState('');
  const [notiTimeWindow, setNotiTimeWindow] = useState('');

  useEffect(() => {
    chrome?.storage?.local.get(['setting.sound','setting.notiRetention','setting.notiTimeWindow'])
      .then((result) => {
        setSound(result['setting.sound']);
        setNotiRetention(result['setting.notiRetention']);
        setNotiTimeWindow(result['setting.notiTimeWindow']);
      });
  }, []);

  function handleChangeSound(sound) {
    console.log('handleChangeSound: ', sound);
    chrome?.storage?.local.set({'setting.sound': sound}).then(() => {
      setSound(sound);
    });
  }

  function handleChangeNotiRetention(notiRetention) {
    console.log('handleChangeNotiRetention: ', notiRetention)
    chrome?.storage?.local.set({'setting.notiRetention': notiRetention}).then(() => {
      setNotiRetention(notiRetention);
    });
  }

  function handleChangeNotiTimeWindow(notiTimeWindow) {
    console.log('handleChangeNotiTimeWindow: ', notiTimeWindow)
    chrome?.storage?.local.set({'setting.notiTimeWindow': notiTimeWindow}).then(() => {
      setNotiTimeWindow(notiTimeWindow);
    });
  }

  return (
    <div className="container">
      {process.env.LOCAL_BUILD && <Debug />}
      <Box style={{
        margin: "auto",
        width: "250px",
      }}>
        <Box display="flex" alignItems="center" p={1}>
          <Typography variant="subtitle1">Sound</Typography>
        </Box>
        <Box display="flex" alignItems="center" p={1}>
          <CustomRadioGroup
            name="sound"
            value={sound}
            onChange={handleChangeSound}
            items={[
              { value: 'none', label: 'None' },
              { value: 'cp77', label: 'Cyberpunk 2077' },
              { value: 'ping', label: 'Ping' },
            ]} />
        </Box>
        <Divider />

        <Box display="flex" alignItems="center" p={1}>
          <Typography variant="subtitle1">Notification Retention</Typography>
        </Box>
        <Box display="flex" alignItems="center" p={1}>
          <CustomRadioGroup
            name="noti-retention"
            value={notiRetention}
            onChange={handleChangeNotiRetention}
            items={[
              { value: 'forever', label: 'Forever' },
              { value: 'transitory', label: 'Transitory' },
            ]} />
        </Box>
        <Divider />

        <Box display="flex" alignItems="center" p={1}>
          <Typography variant="subtitle1">Notification TimeWindow</Typography>
        </Box>
        <Box display="flex" alignItems="center" p={1}>
          <CustomRadioGroup
            name="noti-time-window"
            value={notiTimeWindow}
            onChange={handleChangeNotiTimeWindow}
            items={[
              { value: 1, label: '1 min' },
              { value: 2, label: '2 min' },
              { value: 3, label: '3 min' },
            ]} />
        </Box>
      </Box>
    </div>
  );
}

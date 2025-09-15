import moment from 'moment-timezone';

export function getFilteredSchedules(schedules, nowTsSec, serverTimezoneId = null) {
  const groups = Object.groupBy(schedules, (schedule) => {
    if (!schedule.parentScheduleId) {
      return schedule.scheduleId;
    }
    return schedule.parentScheduleId;
  });
  console.info('today\'s schedule groups: ', groups);

  return Object.values(groups)
    .flatMap((scheduleList) => selectEffectiveSchedule(scheduleList, nowTsSec, serverTimezoneId))
    .filter((schedule) => schedule)
    .map(preProcess)
    .filter((schedule) => !isOutdated(nowTsSec, schedule, serverTimezoneId))
    .filter((schedule) => !isRejected(schedule))
    .sort((a, b) => {
      const aTime = serverTimezoneId ? moment.tz(a.fixedStartDate, serverTimezoneId).valueOf() : moment(a.fixedStartDate).valueOf();
      const bTime = serverTimezoneId ? moment.tz(b.fixedStartDate, serverTimezoneId).valueOf() : moment(b.fixedStartDate).valueOf();
      return aTime - bTime;
    })
    .map(postProcess);
}

export function selectEffectiveSchedule(schedules, nowTsSec, serverTimezoneId = null) {
  if (schedules.length === 1) {
    return schedules[0];
  }

  const parentSchedule = schedules.find((s) => s.repeatDateList?.length > 0);
  if (parentSchedule) {
    return parentSchedule;
  }

  const now = serverTimezoneId
    ? moment.unix(nowTsSec).tz(serverTimezoneId)
    : moment.unix(nowTsSec);

  const todayStart = now.clone().startOf('day');
  const todayEnd = now.clone().endOf('day');

  return schedules.filter((s) => s.parentScheduleId)
    .find((s) => {
      const scheduleTime = serverTimezoneId ? moment.tz(s.startDate, serverTimezoneId) : moment(s.startDate);
      return scheduleTime.isBetween(todayStart, todayEnd);
    });
}

function preProcess(schedule) {
  return {
    fixedStartDate: schedule.repeatDateList?.length > 0 ? schedule.repeatDateList[0].startDate : schedule.startDate,
    ...schedule,
  };
}

function isOutdated(nowTsSec, schedule, serverTimezoneId = null) {
  const scheduleTime = serverTimezoneId ? moment.tz(schedule.fixedStartDate, serverTimezoneId) : moment(schedule.fixedStartDate);
  const scheduleTimestamp = Math.floor(scheduleTime.valueOf() / 1000);
  return nowTsSec - scheduleTimestamp >= 10 * 60;
}

function isRejected(schedule) {
  return schedule.appointment?.responseState === 'reject';
}

function postProcess(schedule) {
  const ret = { ...schedule };
  const converters = [['&lt;', '<'], ['&gt;', '>'], ['&amp;', '&'], ['&ndash;', '-']];

  ret.content = converters.reduce((acc, converter) => acc.replace(converter[0], converter[1]), ret.content);
  ret.memo = converters.reduce((acc, converter) => acc.replace(converter[0], converter[1]), ret.memo);

  return ret;
}

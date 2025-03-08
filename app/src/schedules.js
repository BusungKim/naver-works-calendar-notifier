import moment from 'moment';

export function getFilteredSchedules(schedules, nowTsSec) {
  const groups = Object.groupBy(schedules, (schedule) => {
    if (!schedule.parentScheduleId) {
      return schedule.scheduleId;
    }
    return schedule.parentScheduleId;
  });
  console.info('today\'s schedule groups: ', groups);

  return Object.values(groups)
    .flatMap((scheduleList) => selectEffectiveSchedule(scheduleList, nowTsSec))
    .filter((schedule) => schedule)
    .map(preProcess)
    .filter((schedule) => !isOutdated(nowTsSec, schedule))
    .filter((schedule) => !isRejected(schedule))
    .sort((a, b) => Date.parse(a.fixedStartDate) - Date.parse(b.fixedStartDate))
    .map(postProcess);
}

export function selectEffectiveSchedule(schedules, nowTsSec) {
  if (schedules.length === 1) {
    return schedules[0];
  }

  const parentSchedule = schedules.find((s) => s.repeatDateList?.length > 0);
  if (parentSchedule) {
    return parentSchedule;
  }

  const todayStart = moment.unix(nowTsSec).startOf('day');
  const todayEnd = moment.unix(nowTsSec).endOf('day');

  return schedules.filter((s) => s.parentScheduleId)
    .find((s) => moment(s.startDate).isBetween(todayStart, todayEnd));
}

function preProcess(schedule) {
  return {
    fixedStartDate: schedule.repeatDateList?.length > 0 ? schedule.repeatDateList[0].startDate : schedule.startDate,
    ...schedule,
  };
}

function isOutdated(nowTsSec, schedule) {
  return nowTsSec - Math.floor(Date.parse(schedule.fixedStartDate) / 1000) >= 10 * 60;
}

function isRejected(schedule) {
  return schedule.appointment?.responseState === 'reject';
}

function postProcess(schedule) {
  const ret = { ...schedule };
  ret.content = ret.content
    .replace('&lt;', '<')
    .replace('&gt;', '>')
    .replace('&amp;', '&')
    .replace('&ndash;', '-');

  return ret;
}

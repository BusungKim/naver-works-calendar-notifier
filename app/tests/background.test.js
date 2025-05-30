import { selectEffectiveSchedule } from '../src/schedules';
import moment from 'moment';
import { getWikiUrl } from '../src/background';

test('Pick today\'s schedule if possible', () => {
  const schedules = [
    {
      scheduleId: 'schedule-id',
      repeatDateList: [],
      startDate: '2024-02-02 09:00:00',
      endDate: '2024-02-02 10:00:00',
    },
    {
      scheduleId: 'schedule-id-1',
      parentScheduleId: 'schedule-id',
      startDate: '2024-02-09 09:00:00',
      endDate: '2024-02-09 10:00:00',
    },
    {
      scheduleId: 'schedule-id-2',
      parentScheduleId: 'schedule-id',
      startDate: '2024-02-16 09:00:00',
      endDate: '2024-02-16 10:00:00',
    },
    {
      scheduleId: 'schedule-id-3',
      parentScheduleId: 'schedule-id',
      startDate: '2024-02-23 09:00:00',
      endDate: '2024-02-23 10:00:00',
    },
  ];
  const todayTsSec = moment('2024-02-16 01:23:45').unix();
  expect(selectEffectiveSchedule(schedules, todayTsSec))
    .toEqual({
      scheduleId: 'schedule-id-2',
      parentScheduleId: 'schedule-id',
      startDate: '2024-02-16 09:00:00',
      endDate: '2024-02-16 10:00:00',
    });
});

test('Extract wiki url from memo', () => {
  const testCases = [
    {
      schedule: {
        memo: 'wiki: https://wiki.blahblah.com/pageId=123123123',
      },
      expected: 'https://wiki.blahblah.com/pageId=123123123',
    },
    {
      schedule: {
        memo: '- zoom: https://zoom.foo.bar\n\n- wiki: https://wiki.blahblah.com/pageId=999999\n\n',
      },
      expected: 'https://wiki.blahblah.com/pageId=999999',
    },
    {
      schedule: {
        memo: '(wiki: https://wiki.blahblah.com/pageId=1234)',
      },
      expected: 'https://wiki.blahblah.com/pageId=1234',
    },
  ];
  testCases.forEach((tc) => expect(getWikiUrl(tc.schedule)).toEqual(tc.expected));
});

import { selectEffectiveAmongRepetition } from '../src/schedules';
import moment from 'moment';

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
  expect(selectEffectiveAmongRepetition(schedules, todayTsSec))
    .toEqual({
      scheduleId: 'schedule-id-2',
      parentScheduleId: 'schedule-id',
      startDate: '2024-02-16 09:00:00',
      endDate: '2024-02-16 10:00:00',
    });
});

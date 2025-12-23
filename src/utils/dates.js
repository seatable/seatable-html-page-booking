import dayjs from 'dayjs';
import { DATE_UNIT } from '@/constants/dates';

export const checkHasTimeOut = (dateTime, timeInterval) => {
  // date time is behind of today
  return dayjs(dateTime).add(timeInterval, DATE_UNIT.SECOND).isBefore(dayjs(), DATE_UNIT.MINUTE);
};

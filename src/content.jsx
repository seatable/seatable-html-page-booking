import { useCallback, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/de';
import 'dayjs/locale/fr';
import 'dayjs/locale/ru';
import { DTableEmptyTip, toaster } from 'dtable-ui-component';
import BookingHeader from '@components/header';
import BookingBody from '@components/body';
import { DATE_RANGE_TYPE, DEFAULT_DAY_RANGE, DEFAULT_TIME_INTERVAL } from '@constants/settings';
import { DATE_FORMAT_MAP, DATE_UNIT, DEFAULT_DATE_FORMAT, INTERVALS_WEEK_KEY, MAX_START_TIME, TIME_FORMAT } from '@constants/dates';
import noItemsTipImage from './assets/no-items-tip.png';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

const DAY_WEEK_KEY_MAP = {
  1: INTERVALS_WEEK_KEY.MONDAY,
  2: INTERVALS_WEEK_KEY.TUESDAY,
  3: INTERVALS_WEEK_KEY.WEDNESDAY,
  4: INTERVALS_WEEK_KEY.THURSDAY,
  5: INTERVALS_WEEK_KEY.FRIDAY,
  6: INTERVALS_WEEK_KEY.SATURDAY,
  7: INTERVALS_WEEK_KEY.SUNDAY,
};

export const checkHasTimeOut = (dateTime, timeInterval) => {
  // date time is behind of today
  return dayjs(dateTime).add(timeInterval, DATE_UNIT.SECOND).isBefore(dayjs(), DATE_UNIT.MINUTE);
};

const getDayStartTimeObjs = (date, timeInterval) => {
  if (!date || !timeInterval) return [];
  const isToday = dayjs().isSame(date, DATE_UNIT.DAY);
  const currentDay = dayjs(date).startOf(DATE_UNIT.DAY);
  const nextDay = currentDay.clone().startOf(DATE_UNIT.DAY).add(1, DATE_UNIT.DAY);
  let dateTimeObj = currentDay.clone();
  const startDateTimeObjs = [];
  while (dateTimeObj.isBefore(nextDay)) {
    if ((isToday && !checkHasTimeOut(dateTimeObj, timeInterval)) || !isToday) {
      startDateTimeObjs.push(dateTimeObj);
    }
    dateTimeObj = dateTimeObj.clone().add(timeInterval, DATE_UNIT.SECOND);
  }
  return startDateTimeObjs;
};

const BookingContent = ({
  intervalRows, resourceRows, bookingRows, fetchLatestBookings,
  getResourceName, getResourceRelatedIntervalsIds, getIntervalWeek, getIntervalStart, getIntervalEnd,
  getBookingRelatedResourceRowId, getBookingStartTime, getBookingEndTime, getBookingIsCanceled, addBooking,
  onBookSuccess,
}) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const idIntervalRowMap = useMemo(() => {
    let map = {};
    intervalRows.forEach((intervalRow) => {
      map[intervalRow._id] = intervalRow;
    });
    return map;
  }, [intervalRows]);

  const dateRangeType = useMemo(() => DATE_RANGE_TYPE.DAY_RANGE, []);
  const dayRange = useMemo(() => DEFAULT_DAY_RANGE, []);
  // const endDate = useMemo(() => module.end_date, [module]);
  const timeInterval = useMemo(() => DEFAULT_TIME_INTERVAL, []);

  const resourceRowsLen = useMemo(() => resourceRows.length, [resourceRows]);
  const startDate = useMemo(() => dayjs().startOf(DATE_UNIT.DAY), []);

  const checkIsBookingOngoing = useCallback((bookingRow) => {
    const endTime = getBookingEndTime(bookingRow);
    const isCanceled = getBookingIsCanceled(bookingRow);
    return !!endTime && dayjs(endTime).isValid() && dayjs().isBefore(endTime) && !isCanceled; // not expired and not canceled
  }, [getBookingEndTime, getBookingIsCanceled]);

  const checkHasTimeBooked = useCallback((dateTime, resourceRow, bookingRows) => {
    if (!Array.isArray(bookingRows) || !resourceRow) return false;
    const resourceRelatedBookingRows = bookingRows.filter((bookingRow) => !!getBookingRelatedResourceRowId(bookingRow) && checkIsBookingOngoing(bookingRow));
    if (resourceRelatedBookingRows.length === 0) return;

    const waitingBookStartTimeObj = dayjs(dateTime);
    const waitingBookEndTimeObj = dayjs(waitingBookStartTimeObj).add(timeInterval, 'second');
    return resourceRelatedBookingRows.some((bookingRow) => {
      const startTime = getBookingStartTime(bookingRow);
      const endTime = getBookingEndTime(bookingRow);
      const startTimeObj = startTime && dayjs(startTime);
      const endTimeObj = endTime && dayjs(endTime);
      if (!startTimeObj || !startTimeObj || !startTimeObj.isValid() || !endTimeObj.isValid()) return false;

      // not bookable time: start/end time already been used
      return (
        waitingBookStartTimeObj.isBetween(startTimeObj, endTimeObj, 'minute', '()')
        || waitingBookEndTimeObj.isBetween(startTimeObj, endTimeObj, 'minute', '()')
        || (waitingBookStartTimeObj.isSame(startTimeObj) && waitingBookEndTimeObj.isSame(endTimeObj))
        || (waitingBookStartTimeObj.isBefore(startTimeObj) && waitingBookEndTimeObj.isAfter(endTimeObj))
      );
    });
  }, [timeInterval, getBookingStartTime, getBookingEndTime, getBookingRelatedResourceRowId, checkIsBookingOngoing]);

  const checkIsBetweenIntervals = useCallback((dateTime, intervals) => {
    if (!dateTime || !Array.isArray(intervals) || intervals.length === 0) return false;
    const time = dayjs(dateTime).format(TIME_FORMAT);
    return intervals.some((interval) => {
      const { start_time, end_time } = interval || {};
      if (start_time >= MAX_START_TIME && time >= MAX_START_TIME) return true;
      if (!start_time || !end_time) return false;
      return time >= start_time && time < end_time;
    });
  }, []);

  const allDates = useMemo(() => {
    let renderedDates = [startDate];
    if (dateRangeType === DATE_RANGE_TYPE.DAY_RANGE) {
      if (dayRange > 1) {
        for (let i = 1; i < dayRange; i++) {
          const currDate = startDate.clone().add(i, DATE_UNIT.DAY);
          renderedDates.push(currDate);
        }
      }
    }
    return renderedDates;
  }, [dateRangeType, dayRange, startDate]);

  const dateStartDateTimeObjsMap = useMemo(() => {
    if (!Array.isArray(allDates) || allDates.length === 0) return null;
    let dateDateTimesMap = {};
    allDates.forEach((dateObj) => {
      const startDateTimeObjs = getDayStartTimeObjs(dateObj, timeInterval);
      if (startDateTimeObjs.length > 0) {
        dateDateTimesMap[dayjs(dateObj).format(DEFAULT_DATE_FORMAT)] = startDateTimeObjs;
      }
    });
    return dateDateTimesMap;
  }, [allDates, timeInterval]);

  const idResourceWeekIntervalsMap = useMemo(() => {
    if (
      allDates.length === 0
      || !Array.isArray(resourceRows) || resourceRows.length === 0
      || !Array.isArray(intervalRows) || intervalRows.length === 0
    ) {
      return {};
    }
    let intervalsMap = {};
    resourceRows.forEach((resourceRow) => {
      const relatedIntervalsIds = getResourceRelatedIntervalsIds(resourceRow);
      let weekIntervalsMap = {};
      relatedIntervalsIds.forEach((intervalId) => {
        const intervalRow = idIntervalRowMap[intervalId];
        const week = getIntervalWeek(intervalRow);
        const start_time = getIntervalStart(intervalRow);
        const end_time = getIntervalEnd(intervalRow);
        const weekKey = week && typeof week === 'string' && INTERVALS_WEEK_KEY[week.toUpperCase()];
        if (weekKey && (start_time || end_time)) {
          const weekIntervals = weekIntervalsMap[weekKey] || [];
          weekIntervals.push({ start_time, end_time });
          weekIntervalsMap[weekKey] = weekIntervals;
        }
      });
      if (Object.keys(weekIntervalsMap).length > 0) {
        intervalsMap[resourceRow._id] = weekIntervalsMap;
      }
    });
    return intervalsMap;
  }, [idIntervalRowMap, resourceRows, intervalRows, allDates, getResourceRelatedIntervalsIds, getIntervalWeek, getIntervalStart, getIntervalEnd]);

  const resourceAvailableStartTimesMap = useMemo(() => {
    if (Object.keys(idResourceWeekIntervalsMap).length === 0) return null;
    let resourceStartTimesMap = {};
    resourceRows.forEach((resourceRow) => {
      const weekDetails = idResourceWeekIntervalsMap[resourceRow._id];
      if (weekDetails && dateStartDateTimeObjsMap) {
        let intervalStartDateTimeObjsMap = {};
        Object.keys(dateStartDateTimeObjsMap).forEach((date) => {
          const weekDay = dayjs(date).isoWeekday();
          const weekKey = DAY_WEEK_KEY_MAP[weekDay];
          const intervals = weekDetails[weekKey];
          const startDateTimeObjs = dateStartDateTimeObjsMap[date];
          if (intervals && Array.isArray(startDateTimeObjs) && startDateTimeObjs.length > 0) {
            const validDateStartTimeObjs = startDateTimeObjs.filter((startDateTimeObj) => {
              return checkIsBetweenIntervals(startDateTimeObj, intervals) && !checkHasTimeBooked(startDateTimeObj, resourceRow, bookingRows);
            }).map((startDateTimeObj) => startDateTimeObj.clone());
            if (validDateStartTimeObjs.length > 0) {
              intervalStartDateTimeObjsMap[date] = validDateStartTimeObjs;
            }
          }
        });
        if (Object.keys(intervalStartDateTimeObjsMap).length > 0) {
          resourceStartTimesMap[resourceRow._id] = intervalStartDateTimeObjsMap;
        }
      }
    });
    return resourceStartTimesMap;
  }, [resourceRows, bookingRows, idResourceWeekIntervalsMap, dateStartDateTimeObjsMap, checkIsBetweenIntervals, checkHasTimeBooked]);

  const checkDateBookable = useCallback((dateObj) => {
    if (!resourceAvailableStartTimesMap) return false;
    const date = dayjs(dateObj).format(DEFAULT_DATE_FORMAT);
    return Object.keys(resourceAvailableStartTimesMap).some((resourceRowId) => {
      const dateStartTimesMap = resourceAvailableStartTimesMap[resourceRowId];
      const dateStartTimes = dateStartTimesMap && dateStartTimesMap[date];
      return Array.isArray(dateStartTimes) && dateStartTimes.length > 0;
    });
  }, [resourceAvailableStartTimesMap]);

  const getResourceDateStartTimes = useCallback((dateObj, resourceRow) => {
    if (!resourceAvailableStartTimesMap || !resourceRow || !dateObj) return [];
    const date = dayjs(dateObj).format(DEFAULT_DATE_FORMAT);
    const dateStartTimesMap = resourceAvailableStartTimesMap[resourceRow._id];
    return (dateStartTimesMap && dateStartTimesMap[date]) || [];
  }, [resourceAvailableStartTimesMap]);

  const modifySelectedDate = useCallback((date) => {
    if (dayjs(date).isSame(selectedDate, DATE_UNIT.DAY)) return;
    setSelectedDate(date);
  }, [selectedDate]);

  const submit = useCallback(async ({ resourceRow, startTime }, bookSuccessCallback, bookFailedCallback) => {
    const selectedResourceRowId = resourceRow && resourceRow._id;
    if (!selectedResourceRowId || !selectedDate || !startTime) {
      toaster.danger('Please select an available time slot.');
      bookFailedCallback && bookFailedCallback();
      return;
    }
    if (checkHasTimeOut(startTime, timeInterval)) {
      toaster.danger('This time slot has already been booked. Please refresh and try again.');
      bookFailedCallback && bookFailedCallback();
      return;
    }

    // fetch latest booking data to verify availability
    try {
      const latestBookingRows = await fetchLatestBookings();
      if (!latestBookingRows) {
        toaster.danger('Booking failed. Please refresh and try again.');
        bookFailedCallback && bookFailedCallback();
        return;
      }

      // check if the selected time is still available with latest data
      const isTimeBooked = checkHasTimeBooked(startTime, resourceRow, latestBookingRows);
      if (isTimeBooked) {
        toaster.danger('This time slot has already been booked. Please refresh and try again.');
        bookFailedCallback && bookFailedCallback();
        return;
      }

      const date = dayjs(selectedDate).format(DEFAULT_DATE_FORMAT);
      const time = dayjs(startTime).format(TIME_FORMAT);
      const startDateTime = `${date} ${time}`;
      const endDateTime = dayjs(startTime).add(timeInterval, DATE_UNIT.SECOND).format(DATE_FORMAT_MAP.YYYY_MM_DD_HH_MM);

      await addBooking(startDateTime, endDateTime, selectedResourceRowId);
      onBookSuccess();
      bookSuccessCallback && bookSuccessCallback();
    } catch (error) {
      toaster.danger('Booking failed. Please refresh and try again.');
      bookFailedCallback && bookFailedCallback(error);
    }
  }, [timeInterval, selectedDate, addBooking, onBookSuccess, fetchLatestBookings, checkHasTimeBooked]);


  return (
    <div className="booking-content">
      {resourceRowsLen === 0 && (
        <div className="tips-wrapper">
          <DTableEmptyTip
            src={noItemsTipImage}
            type='error'
            text={'No bookable resources'}
          />
        </div>
      )}
      {resourceRowsLen > 0 && (
        <>
          <BookingHeader
            allDates={allDates}
            selectedDate={selectedDate}
            checkDateBookable={checkDateBookable}
            modifySelectedDate={modifySelectedDate}
          />
          <BookingBody
            resourceRows={resourceRows}
            timeInterval={timeInterval}
            selectedDate={selectedDate}
            getResourceName={getResourceName}
            getResourceDateStartTimes={getResourceDateStartTimes}
            submit={submit}
          />
        </>
      )}
    </div>
  );
};

BookingContent.propTypes = {
  intervalRows: PropTypes.array,
  resourceRows: PropTypes.array,
  bookingRows: PropTypes.array,
  fetchLatestBookings: PropTypes.func,
  getIntervals: PropTypes.func,
  getResources: PropTypes.func,
  getBookings: PropTypes.func,
  getResourceName: PropTypes.func,
  getResourceRelatedIntervalsIds: PropTypes.func,
  getIntervalWeek: PropTypes.func,
  getIntervalStart: PropTypes.func,
  getIntervalEnd: PropTypes.func,
  getBookingRelatedResourceRowId: PropTypes.func,
  getBookingStartTime: PropTypes.func,
  getBookingEndTime: PropTypes.func,
  getBookingIsCanceled: PropTypes.func,
  addBooking: PropTypes.func,
  onBookSuccess: PropTypes.func,
};

export default BookingContent;

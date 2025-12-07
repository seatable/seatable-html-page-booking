import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/de';
import 'dayjs/locale/fr';
import 'dayjs/locale/ru';
import { DATE_FORMAT_MAP, DATE_UNIT, DEFAULT_DATE_FORMAT } from 'dtable-utils';
import { DTableEmptyTip, Loading, toaster } from 'dtable-ui-component';
import BookingHeader from '@components/header';
import BookingBody from '@components/body';
import { DATE_RANGE_TYPE, DEFAULT_DAY_RANGE, DEFAULT_TIME_INTERVAL } from '@constants/settings';
import { INTERVALS_WEEK_KEY, MAX_START_TIME, TIME_FORMAT } from '@constants/dates';
import { getMediaImageSrc } from './utils/common';
import { useApp } from './hooks/app';

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
const PER_PAGE_RECORDS_NUMBER = 10000;

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
  getIntervals, getResources, getBookings,
  getResourceName, getResourceRelatedIntervalsIds, getIntervalWeek, getIntervalStart, getIntervalEnd,
  getBookingRelatedResourceRowId, getBookingStartTime, getBookingEndTime, getBookingIsCanceled, addBooking,
  onBookSuccess,
}) => {
  const { server, appUuid } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [intervalRows, setIntervalRows] = useState([]);
  const [resourceRows, setResourceRows] = useState([]);
  const [bookingRows, setBookingRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const mountedRef = useRef(false);
  const idIntervalRowMapRef = useRef({});

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
      isLoading || allDates.length === 0
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
        const intervalRow = idIntervalRowMapRef.current[intervalId];
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
  }, [isLoading, resourceRows, intervalRows, allDates, getResourceRelatedIntervalsIds, getIntervalWeek, getIntervalStart, getIntervalEnd]);

  const resourceAvailableStartTimesMap = useMemo(() => {
    if (isLoading || Object.keys(idResourceWeekIntervalsMap).length === 0) return null;
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
  }, [isLoading, resourceRows, bookingRows, idResourceWeekIntervalsMap, dateStartDateTimeObjsMap, checkIsBetweenIntervals, checkHasTimeBooked]);

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

  const loadAllIntervals = useCallback(async () => {
    const res = await getIntervals(0, PER_PAGE_RECORDS_NUMBER);
    if (!res) {
      return;
    }
    const { results: perRows } = res.data || {};
    let intervalRows = [];
    if (Array.isArray(perRows) && perRows.length > 0) {
      intervalRows = intervalRows.concat(perRows);
    }
    if (Array.isArray(perRows) && perRows.length === PER_PAGE_RECORDS_NUMBER) {
      const res = await getIntervals(PER_PAGE_RECORDS_NUMBER, PER_PAGE_RECORDS_NUMBER);
      const moreRows = res && res.data && res.data.results;
      if (Array.isArray(moreRows) && moreRows.length > 0) {
        intervalRows = intervalRows.concat(moreRows);
      }
    }
    intervalRows.forEach((intervalRow) => {
      idIntervalRowMapRef.current[intervalRow._id] = intervalRow;
    });
    setIntervalRows(intervalRows);
  }, [getIntervals]);

  const loadAllResources = useCallback(async () => {
    const res = await getResources(0, PER_PAGE_RECORDS_NUMBER);
    if (!res) {
      return;
    }
    const { results: perRows } = res.data || {};
    let resourceRows = [];
    if (Array.isArray(perRows) && perRows.length > 0) {
      resourceRows = resourceRows.concat(perRows);
    }

    if (Array.isArray(perRows) && perRows.length === PER_PAGE_RECORDS_NUMBER) {
      const res = await getResources(PER_PAGE_RECORDS_NUMBER, PER_PAGE_RECORDS_NUMBER);
      const moreRows = res && res.data && res.data.results;
      if (Array.isArray(moreRows) && moreRows.length > 0) {
        resourceRows = resourceRows.concat(moreRows);
      }
    }
    setResourceRows(resourceRows);
  }, [getResources]);

  const fetchLatestBookings = useCallback(async () => {
    const res = await getBookings({ start: 0, limit: PER_PAGE_RECORDS_NUMBER });
    if (!res) return null;
    const { results: perRows } = res.data || {};
    let bookingRows = [];
    if (Array.isArray(perRows) && perRows.length > 0) {
      bookingRows = bookingRows.concat(perRows);
    }
    if (Array.isArray(perRows) && perRows.length === PER_PAGE_RECORDS_NUMBER) {
      const res = await getBookings({ start: PER_PAGE_RECORDS_NUMBER, limit: PER_PAGE_RECORDS_NUMBER });
      const moreRows = res && res.data && res.data.results;
      if (Array.isArray(moreRows) && moreRows.length > 0) {
        bookingRows = bookingRows.concat(moreRows);
      }
    }
    return bookingRows;
  }, [getBookings]);

  const loadAllBookings = useCallback(async () => {
    const bookingRows = await fetchLatestBookings();
    if (bookingRows) {
      setBookingRows(bookingRows);
    }
  }, [fetchLatestBookings]);

  const submit = useCallback(async ({ resourceRow, startTime }, bookSuccessCallback, bookFailedCallback) => {
    const selectedResourceRowId = resourceRow && resourceRow._id;
    if (!selectedResourceRowId || !selectedDate || !startTime || checkHasTimeOut(startTime, timeInterval)) {
      toaster.danger(intl.get('Not_bookable_interval'));
      bookFailedCallback && bookFailedCallback();
      return;
    }

    // fetch latest booking data to verify availability
    try {
      const latestBookingRows = await fetchLatestBookings();
      if (!latestBookingRows) {
        toaster.danger(intl.get('Booking_failed'));
        bookFailedCallback && bookFailedCallback();
        return;
      }

      // check if the selected time is still available with latest data
      const isTimeBooked = checkHasTimeBooked(startTime, resourceRow, latestBookingRows);
      if (isTimeBooked) {
        toaster.danger(intl.get('Booking_failed'));
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
      bookFailedCallback && bookFailedCallback();
      toaster.danger(intl.get('Booking_failed'));
    }
  }, [timeInterval, selectedDate, addBooking, onBookSuccess, fetchLatestBookings, checkHasTimeBooked]);

  const init = useCallback(async () => {
    await loadAllIntervals();
    await loadAllResources();
    await loadAllBookings();
    setIsLoading(false);
  }, [loadAllIntervals, loadAllResources, loadAllBookings]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      init();
    }
  }, [init]);

  return (
    <div className="booking-content">
      {isLoading && <div className="loading-wrapper"><Loading /></div>}
      {(!isLoading && resourceRowsLen === 0) && (
        <div className="tips-wrapper">
          <DTableEmptyTip
            src={getMediaImageSrc('no-items-tip.png', server, appUuid)}
            type='error'
            text={intl.get('No_bookable_resources')}
          />
        </div>
      )}
      {(!isLoading && resourceRowsLen > 0) && (
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

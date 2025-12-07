import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { IconButton } from 'dtable-ui-component';
import { DATE_UNIT } from 'dtable-utils';
import { debounce } from '@utils/common';
import { useApp } from '@/hooks/app';


const NOT_AVAILABLE_SCROLL_DIRECTION = {
  LEFT: 'left',
  RIGHT: 'right',
  BOTH: 'both',
};

const scrollStep = 300;

const intlLocaleCulture = (culture) => {
  return culture === 'en' ? 'en-gb' : culture;
};

const getWeek = (date, lang) => {
  if (dayjs().isSame(date, DATE_UNIT.DAY)) return intl.get('Today');
  return dayjs(date).locale(intlLocaleCulture(lang)).format('ddd', 'en-gb');
};

const Date = ({ dateObj, selectedDate, checkDateBookable, modifySelectedDate }) => {
  const { lang } = useApp();
  const bookable = checkDateBookable(dateObj);
  const week = getWeek(dateObj, lang);
  const day = dateObj.format('DD');
  const bookStatus = bookable ? intl.get('Bookable') : intl.get('Fully_booked');
  return (
    <div
      className={classnames('booking-header-dates-selector-date p-2', { '--selected': dateObj.isSame(selectedDate, DATE_UNIT.DAY) })}
      onClick={() => modifySelectedDate(dateObj)}
      onKeyDown={() => {}}
      role="button"
      tabIndex={0}
      aria-label={`${week} ${day}, ${bookStatus}`}
    >
      <div className="booking-header-dates-selector-date-week">{week}</div>
      <div className="booking-header-dates-selector-date-day">{day}</div>
      <div className={classnames('booking-header-book-status', { 'fully-booked': !bookable })}>
        <span className="booking-header-book-status-text fw-normal">{bookStatus}</span>
      </div>
    </div>
  );
};

Date.propTypes = {
  dateObj: PropTypes.object,
  selectedDate: PropTypes.object,
  checkDateBookable: PropTypes.func,
  modifySelectedDate: PropTypes.func,
};

const DatePanel = ({ allDates, selectedDate, checkDateBookable, modifySelectedDate }) => {
  const { lang } = useApp();
  const datesRef = useRef(null);
  const [scrollNotAvailable, setScrollNotAvailable] = useState(NOT_AVAILABLE_SCROLL_DIRECTION.BOTH);
  const handleManuallyScroll = (direction) => {
    if (!datesRef.current) return;
    const maxScrollLeft = datesRef.current.scrollWidth - datesRef.current.clientWidth;
    if (direction === 'left') {
      datesRef.current.scrollLeft = Math.max(0, datesRef.current.scrollLeft - scrollStep);
    } else {
      datesRef.current.scrollLeft = Math.min(maxScrollLeft, datesRef.current.scrollLeft + scrollStep);
    }
    if (!datesRef.current.scrollLeft) {
      setScrollNotAvailable(NOT_AVAILABLE_SCROLL_DIRECTION.LEFT);
    } else if (datesRef.current.scrollLeft === datesRef.current.scrollWidth - datesRef.current.clientWidth) {
      setScrollNotAvailable(NOT_AVAILABLE_SCROLL_DIRECTION.RIGHT);
    } else {
      setScrollNotAvailable('');
    }
  };

  const setScrollStatus = useCallback(() => {
    if (!datesRef.current) return;
    if (datesRef.current?.scrollWidth === datesRef.current.clientWidth) {
      if (scrollNotAvailable !== NOT_AVAILABLE_SCROLL_DIRECTION.BOTH) {
        setScrollNotAvailable(NOT_AVAILABLE_SCROLL_DIRECTION.BOTH);
      }
      return;
    }
    if (!datesRef.current.scrollLeft) {
      if (scrollNotAvailable !== NOT_AVAILABLE_SCROLL_DIRECTION.LEFT) {
        setScrollNotAvailable(NOT_AVAILABLE_SCROLL_DIRECTION.LEFT);
      }
    } else if (datesRef.current.scrollLeft === datesRef.current.scrollWidth - datesRef.current.clientWidth) {
      if (scrollNotAvailable !== NOT_AVAILABLE_SCROLL_DIRECTION.RIGHT) {
        setScrollNotAvailable(NOT_AVAILABLE_SCROLL_DIRECTION.RIGHT);
      }
    } else {
      if (scrollNotAvailable) {
        setScrollNotAvailable('');
      }
    }
  }, [scrollNotAvailable]);

  const onScroll = debounce(() => {
    setScrollStatus();
  }, 100);

  useLayoutEffect(() => {
    setScrollStatus();
  }, [allDates, setScrollStatus]);

  useEffect(() => {
    const onResize = debounce(() => {
      setScrollStatus();
    }, 100);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [setScrollStatus]);

  return (
    <div className="booking-header-dates-selector">
      <div className="booking-header-dates-selector-year-month">{lang === 'zh-cn' ? selectedDate.format('YYYY 年 MM 月') : selectedDate.format(' YYYY - MM ')}</div>
      <div className="booking-header-dates-selector-panel">
        <div className="booking-header-dates-selector-scroll-control booking-header-dates-selector-scroll-control-left-arrow p-1">
          <IconButton icon="left" disabled={scrollNotAvailable === NOT_AVAILABLE_SCROLL_DIRECTION.LEFT || scrollNotAvailable === NOT_AVAILABLE_SCROLL_DIRECTION.BOTH} onClick={() => handleManuallyScroll('left')} />
        </div>
        <div className="booking-header-dates-selector-dates" ref={datesRef} onScroll={onScroll}>
          {allDates.map((date) => {
            return (
              <Date
                key={date}
                dateObj={date}
                selectedDate={selectedDate}
                checkDateBookable={checkDateBookable}
                modifySelectedDate={() => modifySelectedDate(date)}
              />
            );
          })}
        </div>
        <div className="booking-header-dates-selector-scroll-control booking-header-dates-selector-scroll-control-right-arrow p-1">
          <IconButton icon="right" disabled={scrollNotAvailable === NOT_AVAILABLE_SCROLL_DIRECTION.RIGHT || scrollNotAvailable === NOT_AVAILABLE_SCROLL_DIRECTION.BOTH} onClick={() => handleManuallyScroll('right')} />
        </div>
      </div>
    </div>
  );
};

DatePanel.propTypes = {
  allDates: PropTypes.array,
  selectedDate: PropTypes.object,
  checkDateBookable: PropTypes.func,
  modifySelectedDate: PropTypes.func,
};

export default DatePanel;

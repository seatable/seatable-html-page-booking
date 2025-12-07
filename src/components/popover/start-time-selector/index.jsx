import React, { useCallback, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import { Button, Label } from 'reactstrap';
import classnames from 'classnames';
import dayjs from 'dayjs';
import { DTablePopover } from 'dtable-ui-component';
import { TIME_FORMAT } from '@constants/dates';

import './index.css';

const BookStartTimeSelector = ({ times, modifySelectedStartTime }) => {
  const [isShowPopover, setIsShowPopover] = useState(false);
  const [selectTime, setSelectTime] = useState(null);

  const selectorSelectedContainerRef = useRef(null);

  const displayTime = useMemo(() => {
    if (!selectTime || !dayjs(selectTime).isValid()) return '';
    return dayjs(selectTime).format(TIME_FORMAT);
  }, [selectTime]);

  const togglePopover = useCallback(() => {
    setIsShowPopover(!isShowPopover);
  }, [isShowPopover]);

  const onSelect = useCallback((time) => {
    if (!dayjs(time).isSame(selectTime)) {
      setSelectTime(time);
      modifySelectedStartTime(time);
    }
    setIsShowPopover(false);
  }, [selectTime, modifySelectedStartTime]);

  const renderPopover = useCallback(() => {
    let popoverMaxHeight = 'fit-content';
    let popoverPlacement = 'bottom';
    if (selectorSelectedContainerRef.current) {
      const { top, bottom } = selectorSelectedContainerRef.current.getBoundingClientRect();
      const inputElementToBottom = window.innerHeight - bottom;
      // set popover placement to top if inputElementToBottom is less than 160px
      if (inputElementToBottom < 160) {
        popoverMaxHeight = top - 75 > 0 ? top - 75 : 40;
        popoverPlacement = 'top';
      } else {
        // no need to consider about negative height bacause it's bigger than 160px
        popoverMaxHeight = inputElementToBottom - 70 + 'px';
        popoverPlacement = 'bottom';
      }
    }

    return (
      <DTablePopover
        target={selectorSelectedContainerRef.current}
        popoverClassName='module-book-start-time-selector-popover'
        hideDTablePopover={togglePopover}
        hideDTablePopoverWithEsc={togglePopover}
        placement={popoverPlacement}
        modifiers={[
          { name: 'flip', enabled: false },
          { name: 'preventOverflow', options: { enabled: true, boundariesElement: 'viewport' } },
          { name: 'offset', options: { enabled: true, offset: [0, 5] } },
        ]}
      >
        <div className="module-book-start-time-selector-times-wrapper" >
          <div
            className='module-book-start-time-selector-times-content'
            style={{
              maxHeight: popoverMaxHeight,
            }}
          >
            <div className="module-book-start-time-selector-times">
              {Array.isArray(times) && times.map((timeObj, index) => {
                return (
                  <div key={`module-book-start-time-selector-time-${index}`} className={classnames('module-book-start-time-selector-time', { 'selected': dayjs(timeObj).isSame(selectTime) })}>
                    <Button size="sm" color="secondary" onClick={() => onSelect(timeObj)}>{dayjs(timeObj).format(TIME_FORMAT)}</Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DTablePopover>
    );
  }, [togglePopover, onSelect, times, selectTime]);

  return (
    <div className="module-book-start-time-selector">
      <Label>{intl.get('Start_time')}</Label>
      <div
        ref={selectorSelectedContainerRef}
        className={`form-control ${isShowPopover ? 'form-control-active' : ''} selector-selected-container`}
        onClick={togglePopover}
        onKeyDown={() => {}}
        role="button"
        tabIndex={0}
        aria-label={displayTime}
      >
        <span className="selector-selected">{displayTime}</span>
        <div className="selector-indicator-container">
          <span className="dtable-font dtable-icon-down3"></span>
        </div>
      </div>
      {isShowPopover && renderPopover()}
    </div>
  );
};

BookStartTimeSelector.propTypes = {
  times: PropTypes.array,
  modifySelectedStartTime: PropTypes.func,
};

export default BookStartTimeSelector;

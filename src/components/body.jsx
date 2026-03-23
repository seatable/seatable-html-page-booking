import React, { useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import BookDialog from '@components/dialog/book';

const BookingBody = ({ resourceRows, selectedDate, getResourceName, getResourceDateStartTimes, submit }) => {
  const [isShowBookDialog, setIsShowBookDialog] = useState(false);

  const waitingBookResourceRowRef = useRef(null);
  const waitingBookStartTimesRef = useRef([]);

  const onToggleBook = useCallback((resourceRow = null, startTimes = []) => {
    waitingBookResourceRowRef.current = resourceRow || null;
    waitingBookStartTimesRef.current = startTimes || [];
    setIsShowBookDialog(!isShowBookDialog);
  }, [isShowBookDialog]);

  return (
    <div className="booking-body">
      <div className="booking-body-content">
        <div className="booking-resources-container">
          <div className="booking-resources">
            {resourceRows.map((resourceRow, index) => {
              const resourceName = getResourceName(resourceRow);
              const startTimes = getResourceDateStartTimes(selectedDate, resourceRow);
              const startTimesLen = startTimes.length;
              const isFullyBooked = startTimesLen === 0;
              return (
                <div className="booking-resource" key={`booking-resource-${index}`}>
                  <div className="booking-resource-content">
                    <span className="booking-resource-name" title={resourceName}>{resourceName}</span>
                    <span className={classnames('booking-badge-remaining ml-2 pl-1 pr-1', { 'fully-booked': isFullyBooked })}>{isFullyBooked ? 'Full' : `${startTimesLen} left`}</span>
                  </div>
                  <div className="booking-resource-more-operations ml-4">
                    <button className={classnames('btn btn-book-now fw-normal', { 'disabled': isFullyBooked })} onClick={() => isFullyBooked ? {} : onToggleBook(resourceRow, startTimes)}>{'Book now'}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {isShowBookDialog && (
        <BookDialog
          resourceRow={waitingBookResourceRowRef.current}
          selectedDate={selectedDate}
          times={waitingBookStartTimesRef.current}
          getResourceName={getResourceName}
          toggle={onToggleBook}
          submit={submit}
        />
      )}
    </div>
  );
};

BookingBody.propTypes = {
  resourceRows: PropTypes.array,
  selectedDate: PropTypes.object,
  getResourceName: PropTypes.func,
  getResourceDateStartTimes: PropTypes.func,
  submit: PropTypes.func,
};

export default BookingBody;

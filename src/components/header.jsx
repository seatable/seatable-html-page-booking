import PropTypes from 'prop-types';
import DatePanel from './date-panel';

const BookingHeader = ({ allDates, selectedDate, checkDateBookable, modifySelectedDate }) => {
  return (
    <div className="booking-header">
      <DatePanel
        allDates={allDates}
        selectedDate={selectedDate}
        checkDateBookable={checkDateBookable}
        modifySelectedDate={modifySelectedDate}
      />
    </div>
  );
};

BookingHeader.propTypes = {
  allDates: PropTypes.array,
  selectedDate: PropTypes.object,
  checkDateBookable: PropTypes.func,
  modifySelectedDate: PropTypes.func,
};

export default BookingHeader;

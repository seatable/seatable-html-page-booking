import { useCallback, useMemo, useState } from 'react';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Button } from 'reactstrap';
import { CellType, getTableByName, getTableColumnByName } from 'dtable-utils';
import { DTableEmptyTip } from 'dtable-ui-component';
import BookingContent from './content';
import { useApp } from './hooks/app';
import { checkHasMissingRequiredFields } from './utils/field';
import { handleExecutionCostExceedError } from './utils/error-message';
import context from './context';
import successfullyBookingImage from './assets/booking-successfully.png';
import { getMediaImageSrc } from './utils/common';

/**
 * intervals table: Intervals
 * name column: name
 * week column: week
 * start column: start
 * end column: end
 *
 * resources_ able: Resources
 * name column: name
 * intervals column: intervals
 *
 * bookings table: Bookings
 * name column: name
 * start time column: start_time
 * end time column: end time
 * resource column: resource
 * is canceled column: is_canceled
 */

const INTERVALS_TABLE_NAME = 'Intervals';
const INTERVALS_REQUIRED_FIELDS = {
  NAME: { name: 'name', type: CellType.TEXT },
  WEEK: { name: 'week', type: CellType.TEXT },
  START: { name: 'start', type: CellType.TEXT },
  END: { name: 'end', type: CellType.TEXT },
};

const RESOURCES_TABLE_NAME = 'Resources';
const RESOURCES_REQUIRED_FIELDS = {
  NAME: { name: 'name', type: CellType.TEXT },
  INTERVALS: { name: 'intervals', type: CellType.LINK },
};

const BOOKINGS_TABLE_NAME = 'Bookings';
const BOOKINGS_REQUIRED_FIELDS = {
  NAME: { name: 'name', type: CellType.TEXT },
  START_TIME: { name: 'start_time', type: CellType.DATE },
  END_TIME: { name: 'end_time', type: CellType.DATE },
  RESOURCE: { name: 'resource', type: CellType.LINK },
  IS_CANCELED: { name: 'is_canceled', type: CellType.CHECKBOX },
};

const getRequiredField = ({ name, type }, table) => {
  const column = getTableColumnByName(table, name);
  return column && column.type === type ? column : null;
};

const Booking = () => {
  const { tables, server, appUuid } = useApp();
  const [isShowBookSuccess, setIsShowBookSuccess] = useState(false);

  // intervals table
  const intervalsTable = getTableByName(tables, INTERVALS_TABLE_NAME);
  const intervalsNameColumn = useMemo(
    () => getRequiredField(INTERVALS_REQUIRED_FIELDS.NAME, intervalsTable),
    [intervalsTable]
  );
  const intervalsWeekColumn = useMemo(
    () => getRequiredField(INTERVALS_REQUIRED_FIELDS.WEEK, intervalsTable),
    [intervalsTable]
  );
  const intervalsStartColumn = useMemo(
    () => getRequiredField(INTERVALS_REQUIRED_FIELDS.START, intervalsTable),
    [intervalsTable]
  );
  const intervalsEndColumn = useMemo(
    () => getRequiredField(INTERVALS_REQUIRED_FIELDS.END, intervalsTable),
    [intervalsTable]
  );

  // resources table
  const resourcesTable = useMemo(
    () => getTableByName(tables, RESOURCES_TABLE_NAME),
    [tables]
  );
  const resourcesNameColumn = useMemo(
    () => getRequiredField(RESOURCES_REQUIRED_FIELDS.NAME, resourcesTable),
    [resourcesTable]
  );
  const resourcesRelatedIntervalsColumn = useMemo(
    () => getRequiredField(RESOURCES_REQUIRED_FIELDS.INTERVALS, resourcesTable),
    [resourcesTable]
  );

  // bookings table
  const bookingsTable = useMemo(
    () => getTableByName(tables, BOOKINGS_TABLE_NAME),
    [tables]
  );
  const bookingsNameColumn = useMemo(
    () => getRequiredField(BOOKINGS_REQUIRED_FIELDS.NAME, bookingsTable),
    [bookingsTable]
  );
  const bookingsStartTimeColumn = useMemo(
    () => getRequiredField(BOOKINGS_REQUIRED_FIELDS.START_TIME, bookingsTable),
    [bookingsTable]
  );
  const bookingsEndTimeColumn = useMemo(
    () => getRequiredField(BOOKINGS_REQUIRED_FIELDS.END_TIME, bookingsTable),
    [bookingsTable]
  );
  const bookingsRelatedResourceColumn = useMemo(
    () => getRequiredField(BOOKINGS_REQUIRED_FIELDS.RESOURCE, bookingsTable),
    [bookingsTable]
  );
  const bookingsIsCanceledColumn = useMemo(
    () => getRequiredField(BOOKINGS_REQUIRED_FIELDS.IS_CANCELED, bookingsTable),
    [bookingsTable]
  );

  const hasMissingRequiredFields = useMemo(() => {
    return (
      checkHasMissingRequiredFields([
        { column: intervalsNameColumn, required_type: CellType.TEXT },
        { column: intervalsWeekColumn, required_type: CellType.TEXT },
        { column: intervalsStartColumn, required_type: CellType.TEXT },
        { column: intervalsEndColumn, required_type: CellType.TEXT },
      ]) ||
      checkHasMissingRequiredFields([
        { column: resourcesNameColumn, required_type: CellType.TEXT },
        {
          column: resourcesRelatedIntervalsColumn,
          required_type: CellType.LINK,
        },
      ]) ||
      checkHasMissingRequiredFields([
        { column: bookingsNameColumn, required_type: CellType.TEXT },
        { column: bookingsStartTimeColumn, required_type: CellType.DATE },
        { column: bookingsEndTimeColumn, required_type: CellType.DATE },
        { column: bookingsRelatedResourceColumn, required_type: CellType.LINK },
        { column: bookingsIsCanceledColumn, required_type: CellType.CHECKBOX },
      ])
    );
  }, [
    intervalsNameColumn,
    intervalsWeekColumn,
    intervalsStartColumn,
    intervalsEndColumn,
    resourcesNameColumn,
    resourcesRelatedIntervalsColumn,
    bookingsNameColumn,
    bookingsStartTimeColumn,
    bookingsEndTimeColumn,
    bookingsRelatedResourceColumn,
    bookingsIsCanceledColumn,
  ]);

  const getResourceName = useCallback(
    (resourceRow) => {
      return resourceRow?.[resourcesNameColumn.key] || '';
    },
    [resourcesNameColumn]
  );

  const getResourceRelatedIntervalsIds = useCallback(
    (row) => {
      const links = row?.[resourcesRelatedIntervalsColumn.key];
      return Array.isArray(links)
        ? links.map((link) => link?.row_id).filter(Boolean)
        : [];
    },
    [resourcesRelatedIntervalsColumn]
  );

  const getIntervalWeek = useCallback(
    (row) => {
      return row?.[intervalsWeekColumn.key] || '';
    },
    [intervalsWeekColumn]
  );

  const getIntervalStart = useCallback(
    (row) => {
      return row?.[intervalsStartColumn.key] || '';
    },
    [intervalsStartColumn]
  );

  const getIntervalEnd = useCallback(
    (row) => {
      return row?.[intervalsEndColumn.key] || '';
    },
    [intervalsEndColumn]
  );

  const getBookingRelatedResourceRowId = useCallback(
    (row) => {
      const links = row?.[bookingsRelatedResourceColumn.key];
      const relatedResourceRowsIds = Array.isArray(links)
        ? links.map((link) => link?.row_id).filter(Boolean)
        : [];
      return relatedResourceRowsIds[0] || '';
    },
    [bookingsRelatedResourceColumn]
  );

  const getBookingStartTime = useCallback(
    (row) => {
      return row?.[bookingsStartTimeColumn.key] || '';
    },
    [bookingsStartTimeColumn]
  );

  const getBookingEndTime = useCallback(
    (row) => {
      return row?.[bookingsEndTimeColumn.key] || '';
    },
    [bookingsEndTimeColumn]
  );

  const getBookingIsCanceled = useCallback(
    (row) => {
      return row?.[bookingsIsCanceledColumn.key] || false;
    },
    [bookingsIsCanceledColumn]
  );

  const getIntervals = useCallback((start, limit) => {
    try {
      return context.getRows(INTERVALS_TABLE_NAME, start, limit);
    } catch (error) {
      handleExecutionCostExceedError(error);
      return null;
    }
  }, []);

  const getResources = useCallback((start, limit) => {
    try {
      return context.getRows(RESOURCES_TABLE_NAME, start, limit);
    } catch (error) {
      handleExecutionCostExceedError(error);
      return null;
    }
  }, []);

  const getBookings = useCallback(({ start, limit }) => {
    try {
      return context.getRows(BOOKINGS_TABLE_NAME, start, limit);
    } catch (error) {
      handleExecutionCostExceedError(error);
      return null;
    }
  }, []);

  const addBooking = useCallback(
    async (startTime, endTime, resourceRowId) => {
      const linkId = bookingsRelatedResourceColumn.data?.link_id;
      if (!linkId) return;
      const username = await context.getAppSetting('name');
      const rowData = {
        [bookingsNameColumn.name]: username,
        [bookingsStartTimeColumn.name]: startTime,
        [bookingsEndTimeColumn.name]: endTime,
      };
      const linkRows = [
        {
          link_id: linkId,
          other_table_name: RESOURCES_TABLE_NAME,
          row_ids: [resourceRowId],
        },
      ];
      return context.addRow(BOOKINGS_TABLE_NAME, rowData, linkRows);
    },
    [
      bookingsNameColumn,
      bookingsStartTimeColumn,
      bookingsEndTimeColumn,
      bookingsRelatedResourceColumn,
    ]
  );

  const onBookSuccess = useCallback(() => {
    setIsShowBookSuccess(true);
  }, []);

  const onBookingNew = useCallback(() => {
    setIsShowBookSuccess(false);
  }, []);

  return (
    <div className={classnames('booking-wrapper', { 'book-success-tips-page': isShowBookSuccess })}>
      {hasMissingRequiredFields && (
        <div className="tips-wrapper">
          <DTableEmptyTip
            src={getMediaImageSrc('no-items-tip.png', server, appUuid)}
            type="error"
            text={intl.get('Page_unavailable')}
          />
        </div>
      )}
      {isShowBookSuccess && (
        <div className="tips-wrapper successfully-booking-tips">
          <img alt={intl.get('Successfully_booking')} src={successfullyBookingImage} />
          <p className="successfully-booking-tips-text">{intl.get('Successfully_booking')}</p>
          <div className="btn-booking-new-container">
            <Button className="btn-booking-new" onClick={onBookingNew}>{intl.get('Booking_a_new_one')}</Button>
          </div>
        </div>
      )}
      {!hasMissingRequiredFields && !isShowBookSuccess && (
        <BookingContent
          getIntervals={getIntervals}
          getResources={getResources}
          getBookings={getBookings}
          getResourceName={getResourceName}
          getResourceRelatedIntervalsIds={getResourceRelatedIntervalsIds}
          getIntervalWeek={getIntervalWeek}
          getIntervalStart={getIntervalStart}
          getIntervalEnd={getIntervalEnd}
          getBookingStartTime={getBookingStartTime}
          getBookingEndTime={getBookingEndTime}
          getBookingRelatedResourceRowId={getBookingRelatedResourceRowId}
          getBookingIsCanceled={getBookingIsCanceled}
          addBooking={addBooking}
          onBookSuccess={onBookSuccess}
        />
      )}
    </div>
  );
};

export default Booking;

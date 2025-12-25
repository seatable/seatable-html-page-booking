import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classnames from 'classnames';
import { Button } from 'reactstrap';
import { DTableEmptyTip, Loading } from 'dtable-ui-component';
import BookingContent from './content';
import { handleExecutionCostExceedError } from './utils/error-message';
import context from './context';
import successfullyBookingImage from './assets/booking-successfully.png';
import noItemsTipImage from './assets/no-items-tip.png';

const PER_PAGE_RECORDS_NUMBER = 10000;

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
  NAME: { name: 'name', type: 'text' },
  WEEK: { name: 'week', type: 'text' },
  START: { name: 'start', type: 'text' },
  END: { name: 'end', type: 'text' },
};

const RESOURCES_TABLE_NAME = 'Resources';
const RESOURCES_REQUIRED_FIELDS = {
  NAME: { name: 'name', type: 'text' },
  INTERVALS: { name: 'intervals', type: 'link' },
};

const BOOKINGS_TABLE_NAME = 'Bookings';
const BOOKINGS_REQUIRED_FIELDS = {
  NAME: { name: 'name', type: 'text' },
  START_TIME: { name: 'start_time', type: 'date' },
  END_TIME: { name: 'end_time', type: 'date' },
  RESOURCE: { name: 'resource', type: 'link' },
  IS_CANCELED: { name: 'is_canceled', type: 'checkbox' },
};

const getTableColumnByName = (table, columnName) => {
  if (!table || !Array.isArray(table.columns) || !columnName) return null;
  return table.columns.find(function (column) {
    return column.name === columnName;
  });
};

const getRequiredField = ({ name, type }, columns) => {
  const column = getTableColumnByName({ columns }, name);
  return column && column.type === type ? column : null;
};

const checkHasMissingRequiredFields = (fields) => {
  if (!Array.isArray(fields) || fields.length === 0) return true;
  const validFields = fields.filter((field) => !!field.column);
  if (validFields.length < fields.length) return true;
  return validFields.some((filed) => {
    return filed.column.type !== filed.required_type;
  });
};

const Booking = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [intervalRows, setIntervalRows] = useState([]);
  const [intervalColumns, setIntervalColumns] = useState([]);
  const [resourceRows, setResourceRows] = useState([]);
  const [resourceColumns, setResourceColumns] = useState([]);
  const [bookingRows, setBookingRows] = useState([]);
  const [bookingColumns, setBookingColumns] = useState([]);
  const [isShowBookSuccess, setIsShowBookSuccess] = useState(false);

  const mountedRef = useRef(false);

  // intervals table
  const intervalsNameColumn = useMemo(
    () => getRequiredField(INTERVALS_REQUIRED_FIELDS.NAME, intervalColumns),
    [intervalColumns]
  );
  const intervalsWeekColumn = useMemo(
    () => getRequiredField(INTERVALS_REQUIRED_FIELDS.WEEK, intervalColumns),
    [intervalColumns]
  );
  const intervalsStartColumn = useMemo(
    () => getRequiredField(INTERVALS_REQUIRED_FIELDS.START, intervalColumns),
    [intervalColumns]
  );
  const intervalsEndColumn = useMemo(
    () => getRequiredField(INTERVALS_REQUIRED_FIELDS.END, intervalColumns),
    [intervalColumns]
  );

  // resources table
  const resourcesNameColumn = useMemo(
    () => getRequiredField(RESOURCES_REQUIRED_FIELDS.NAME, resourceColumns),
    [resourceColumns]
  );
  const resourcesRelatedIntervalsColumn = useMemo(
    () => getRequiredField(RESOURCES_REQUIRED_FIELDS.INTERVALS, resourceColumns),
    [resourceColumns]
  );

  // bookings table
  const bookingsNameColumn = useMemo(
    () => getRequiredField(BOOKINGS_REQUIRED_FIELDS.NAME, bookingColumns),
    [bookingColumns]
  );
  const bookingsStartTimeColumn = useMemo(
    () => getRequiredField(BOOKINGS_REQUIRED_FIELDS.START_TIME, bookingColumns),
    [bookingColumns]
  );
  const bookingsEndTimeColumn = useMemo(
    () => getRequiredField(BOOKINGS_REQUIRED_FIELDS.END_TIME, bookingColumns),
    [bookingColumns]
  );
  const bookingsRelatedResourceColumn = useMemo(
    () => getRequiredField(BOOKINGS_REQUIRED_FIELDS.RESOURCE, bookingColumns),
    [bookingColumns]
  );
  const bookingsIsCanceledColumn = useMemo(
    () => getRequiredField(BOOKINGS_REQUIRED_FIELDS.IS_CANCELED, bookingColumns),
    [bookingColumns]
  );

  const hasMissingRequiredFields = useMemo(() => {
    if (isLoading) return false;
    return (
      checkHasMissingRequiredFields([
        { column: intervalsNameColumn, required_type: 'text' },
        { column: intervalsWeekColumn, required_type: 'text' },
        { column: intervalsStartColumn, required_type: 'text' },
        { column: intervalsEndColumn, required_type: 'text' },
      ]) ||
      checkHasMissingRequiredFields([
        { column: resourcesNameColumn, required_type: 'text' },
        { column: resourcesRelatedIntervalsColumn, required_type: 'link' },
      ]) ||
      checkHasMissingRequiredFields([
        { column: bookingsNameColumn, required_type: 'text' },
        { column: bookingsStartTimeColumn, required_type: 'date' },
        { column: bookingsEndTimeColumn, required_type: 'date' },
        { column: bookingsRelatedResourceColumn, required_type: 'link' },
        { column: bookingsIsCanceledColumn, required_type: 'checkbox' },
      ])
    );
  }, [
    isLoading,
    intervalsNameColumn, intervalsWeekColumn, intervalsStartColumn, intervalsEndColumn,
    resourcesNameColumn, resourcesRelatedIntervalsColumn,
    bookingsNameColumn, bookingsStartTimeColumn, bookingsEndTimeColumn, bookingsRelatedResourceColumn, bookingsIsCanceledColumn,
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
      return context.listRows({ tableName: INTERVALS_TABLE_NAME, start, limit });
    } catch (error) {
      handleExecutionCostExceedError(error);
      return null;
    }
  }, []);

  const getResources = useCallback((start, limit) => {
    try {
      return context.listRows({ tableName: RESOURCES_TABLE_NAME, start, limit });
    } catch (error) {
      handleExecutionCostExceedError(error);
      return null;
    }
  }, []);

  const getBookings = useCallback(({ start, limit }) => {
    try {
      return context.listRows({ tableName: BOOKINGS_TABLE_NAME, start, limit });
    } catch (error) {
      handleExecutionCostExceedError(error);
      return null;
    }
  }, []);

  const addBooking = useCallback(
    async (startTime, endTime, resourceRowId) => {
      const linkColumnName = bookingsRelatedResourceColumn.name;
      if (!linkColumnName) return;
      const rowData = {
        [bookingsNameColumn.name]: '',
        [bookingsStartTimeColumn.name]: startTime,
        [bookingsEndTimeColumn.name]: endTime,
      };
      const rowLinksData = [{
        link_column_name: linkColumnName,
        other_rows_ids: [resourceRowId],
      }];
      return context.addRow({ tableName: BOOKINGS_TABLE_NAME, rowData, rowLinksData });
    },
    [
      bookingsNameColumn,
      bookingsStartTimeColumn,
      bookingsEndTimeColumn,
      bookingsRelatedResourceColumn,
    ]
  );

  const loadAllIntervals = useCallback(async () => {
    const res = await getIntervals(0, PER_PAGE_RECORDS_NUMBER);
    if (!res) {
      return;
    }
    const { results: perRows, metadata } = res.data || {};
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
    setIntervalRows(intervalRows);
    setIntervalColumns(metadata || []);
  }, [getIntervals]);

  const loadAllResources = useCallback(async () => {
    const res = await getResources(0, PER_PAGE_RECORDS_NUMBER);
    if (!res) {
      return;
    }
    const { results: perRows, metadata } = res.data || {};
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
    setResourceColumns(metadata || []);
  }, [getResources]);

  const fetchLatestBookings = useCallback(async () => {
    const res = await getBookings({ start: 0, limit: PER_PAGE_RECORDS_NUMBER });
    if (!res) return { rows: [], columns: [] };
    const { results: perRows, metadata } = res.data || {};
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
    return { rows: bookingRows, columns: metadata || [] };
  }, [getBookings]);

  const loadAllBookings = useCallback(async () => {
    const { rows, columns } = await fetchLatestBookings() || {};
    setBookingRows(rows);
    setBookingColumns(columns);
  }, [fetchLatestBookings]);


  const init = useCallback(async () => {
    await loadAllIntervals();
    await loadAllResources();
    await loadAllBookings();
    setIsLoading(false);
  }, [loadAllIntervals, loadAllResources, loadAllBookings]);

  const onBookSuccess = useCallback(() => {
    setIsShowBookSuccess(true);
  }, []);

  const onBookingNew = useCallback(() => {
    setIsShowBookSuccess(false);
    setIsLoading(true);
    init();
  }, [init]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      init();
    }
  }, [init]);

  return (
    <div className={classnames('booking-wrapper', { 'book-success-tips-page': isShowBookSuccess })}>
      {hasMissingRequiredFields && (
        <div className="tips-wrapper">
          <DTableEmptyTip
            src={noItemsTipImage}
            type="error"
            text={'当前页面无法访问。请联系管理员。'}
          />
        </div>
      )}
      {isShowBookSuccess && (
        <div className="tips-wrapper successfully-booking-tips">
          <img alt={'预约成功'} src={successfullyBookingImage} />
          <p className="successfully-booking-tips-text">{'预约成功'}</p>
          <div className="btn-booking-new-container">
            <Button className="btn-booking-new" onClick={onBookingNew}>{'再次预约'}</Button>
          </div>
        </div>
      )}
      {(isLoading && !isShowBookSuccess) && <div className="loading-wrapper"><Loading /></div>}
      {(!isLoading && !isShowBookSuccess) && (
        <BookingContent
          intervalRows={intervalRows}
          resourceRows={resourceRows}
          bookingRows={bookingRows}
          fetchLatestBookings={fetchLatestBookings}
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

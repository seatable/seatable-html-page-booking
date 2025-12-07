import intl from 'react-intl-universal';
import { toaster } from 'dtable-ui-component';

const SERVER_ERROR_MSG = {
  EXECUTION_COST_EXCEEDED: 'Execution cost exceeded',
  ROWS_LOCKED: 'Row(s) locked',
  ROW_NOT_FOUND: 'Row not found or archived',
};

const SERVER_ERROR_DISPLAY_KEY = {
  EXECUTION_COST_EXCEEDED: 'Execution_time_of_the_query_exceeds_the_limit',
  MODIFY_ROW_LOCKED: 'Failed_to_modify_locked_record',
  MODIFY_ROWS_LOCKED: 'Failed_to_modify_locked_records',
  DELETE_ROW_LOCKED: 'Failed_to_delete_locked_record',
  DELETE_ROWS_LOCKED: 'Failed_to_delete_locked_records',
  ROW_NOT_FOUND: 'Failed_to_modify_not_found_record',
};

export const handleExecutionCostExceedError = (error) => {
  if (!error || !error.response || !error.response.data || error.response.data.error_msg !== SERVER_ERROR_MSG.EXECUTION_COST_EXCEEDED) {
    return false;
  }
  toaster.danger(intl.get(SERVER_ERROR_DISPLAY_KEY[SERVER_ERROR_MSG.EXECUTION_COST_EXCEEDED]));
  return true;
};

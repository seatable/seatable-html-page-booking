import { toaster } from 'dtable-ui-component';

const SERVER_ERROR_MSG = {
  EXECUTION_COST_EXCEEDED: 'Execution cost exceeded',
  ROWS_LOCKED: 'Row(s) locked',
  ROW_NOT_FOUND: 'Row not found or archived',
};

export const handleExecutionCostExceedError = (error) => {
  if (!error || !error.response || !error.response.data || error.response.data.error_msg !== SERVER_ERROR_MSG.EXECUTION_COST_EXCEEDED) {
    return false;
  }
  toaster.danger('Execution time of the query exceeds the limit. Data cannot be loaded.');
  return true;
};

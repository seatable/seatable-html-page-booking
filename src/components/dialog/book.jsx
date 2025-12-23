import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalBody, ModalFooter, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import dayjs from 'dayjs';
import { DTableModalHeader, Loading } from 'dtable-ui-component';
import keyCodes from '@constants/key-codes';
import BookStartTimeSelector from '../popover/start-time-selector';
import { DEFAULT_DATE_FORMAT } from '@/constants/dates';

const BookDialog = ({ resourceRow, selectedDate, times, getResourceName, toggle, submit }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [errMessage, setErrMessage] = useState('');

  const selectedStartTimeRef = useRef(null);

  const modifySelectedStartTime = useCallback((startTime) => {
    selectedStartTimeRef.current = startTime;
  }, []);

  const bookSuccessCallback = useCallback(() => {
    toggle();
  }, [toggle]);

  const bookFailedCallback = useCallback(() => {
    setIsSaving(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedStartTimeRef.current) {
      setErrMessage('开始时间不能为空');
      return;
    }

    setIsSaving(true);
    submit({ resourceRow, startTime: selectedStartTimeRef.current }, bookSuccessCallback, bookFailedCallback);
  }, [resourceRow, bookSuccessCallback, bookFailedCallback, submit]);

  const onHotKey = useCallback((e) => {
    if (e.keyCode === keyCodes.Enter) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  useEffect(() => {
    document.addEventListener('keydown', onHotKey);
    return () => {
      document.removeEventListener('keydown', onHotKey);
    };
  }, [onHotKey]);

  return (
    <Modal
      isOpen
      toggle={toggle}
      className="book-dialog"
    >
      <DTableModalHeader toggle={toggle}>{'预定'}</DTableModalHeader>
      <ModalBody>
        <Form>
          <FormGroup>
            <Label for="new-book-resource-name">{'名称'}</Label>
            <Input disabled id="new-book-resource-name" defaultValue={getResourceName(resourceRow)} />
          </FormGroup>
          <FormGroup>
            <Label for="new-book-date">{'日期'}</Label>
            <Input disabled id="new-book-date" defaultValue={dayjs(selectedDate).format(DEFAULT_DATE_FORMAT)} />
          </FormGroup>
          <FormGroup>
            <BookStartTimeSelector times={times} modifySelectedStartTime={modifySelectedStartTime} />
          </FormGroup>
        </Form>
        {errMessage && <Alert color="danger" className="mt-2">{errMessage}</Alert>}
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={toggle}>{'取消'}</Button>
        {isSaving ?
          <Button color="primary" disabled><Loading /></Button> :
          <Button color="primary" onClick={handleSubmit}>{'提交'}</Button>
        }
      </ModalFooter>
    </Modal>
  );
};

BookDialog.propTypes = {
  resourceRow: PropTypes.object,
  selectedDate: PropTypes.object,
  times: PropTypes.array,
  getResourceName: PropTypes.func,
  toggle: PropTypes.func,
  submit: PropTypes.func,
};

export default BookDialog;

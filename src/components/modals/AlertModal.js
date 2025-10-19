import React, { useState } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import './AlertModal.css';

const AlertModal = ({ isVisible, onClose, onSubmit, trailId, trailName, loading = false }) => {
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('general');
  const [alertDuration, setAlertDuration] = useState(null);
  const [isTimedAlert, setIsTimedAlert] = useState(false);

  const handleSubmit = () => {
    if (!alertMessage.trim()) {
      return;
    }

    if (isTimedAlert && (!alertDuration || alertDuration <= 0)) {
      return;
    }

    const alertData = {
      message: alertMessage,
      type: alertType,
      duration: isTimedAlert ? alertDuration : null,
      isTimed: isTimedAlert,
    };

    onSubmit(alertData);
  };

  const handleClose = () => {
    // Reset form
    setAlertMessage('');
    setAlertType('general');
    setAlertDuration(null);
    setIsTimedAlert(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className='alert-modal-overlay' onClick={handleClose}>
      <div className='alert-modal-content' onClick={e => e.stopPropagation()}>
        <div className='alert-modal-header'>
          <div className='alert-modal-title'>
            <AlertTriangle size={20} />
            <h3>Add Alert</h3>
          </div>
          <button className='alert-modal-close' onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {trailName && (
          <div className='alert-modal-trail-info'>
            <span className='alert-modal-trail-label'>Trail:</span>
            <span className='alert-modal-trail-name'>{trailName}</span>
          </div>
        )}

        <div className='alert-modal-body'>
          <div className='alert-form-group'>
            <label htmlFor='alert-type'>Alert Type</label>
            <select
              id='alert-type'
              value={alertType}
              onChange={e => setAlertType(e.target.value)}
              className='alert-form-select'
            >
              <option value='general'>General</option>
              <option value='safety'>Safety</option>
              <option value='weather'>Weather</option>
              <option value='maintenance'>Maintenance</option>
              <option value='wildlife'>Wildlife</option>
              <option value='closure'>Closure</option>
            </select>
          </div>

          <div className='alert-form-group'>
            <label htmlFor='alert-message'>Alert Message</label>
            <textarea
              id='alert-message'
              value={alertMessage}
              onChange={e => setAlertMessage(e.target.value)}
              placeholder='Describe the alert or important information...'
              className='alert-form-textarea'
              rows={4}
              maxLength={500}
            />
            <div className='alert-form-char-count'>{alertMessage.length}/500 characters</div>
          </div>

          <div className='alert-form-group'>
            <label className='alert-form-checkbox-label'>
              <input
                type='checkbox'
                checked={isTimedAlert}
                onChange={e => setIsTimedAlert(e.target.checked)}
                className='alert-form-checkbox'
              />
              <Clock size={16} />
              Make this a timed alert
            </label>
          </div>

          {isTimedAlert && (
            <div className='alert-form-group'>
              <label htmlFor='alert-duration'>Duration (minutes)</label>
              <input
                id='alert-duration'
                type='number'
                value={alertDuration || ''}
                onChange={e => setAlertDuration(parseInt(e.target.value) || null)}
                placeholder='Enter duration in minutes'
                className='alert-form-input'
                min='1'
                max='1440'
              />
              <div className='alert-form-help-text'>
                Alert will automatically expire after the specified duration
                <br />
                <small>Range: 1 minute to 24 hours (1440 minutes)</small>
              </div>
            </div>
          )}
        </div>

        <div className='alert-modal-footer'>
          <button
            className='alert-btn alert-btn-secondary'
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className='alert-btn alert-btn-primary'
            onClick={handleSubmit}
            disabled={
              loading ||
              !alertMessage.trim() ||
              (isTimedAlert && (!alertDuration || alertDuration <= 0))
            }
          >
            {loading ? 'Submitting...' : 'Submit Alert'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;

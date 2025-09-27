import React, { useEffect } from 'react';

const StatusConfirmModal = ({ isOpen, onClose, onConfirm, trailName, currentStatus }) => {
  const newStatus = currentStatus === 'open' ? 'closed' : 'open';
  const actionText = newStatus === 'closed' ? 'close' : 'reopen';
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'static';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'static';
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`status-confirm-overlay ${isOpen ? 'open' : ''}`} 
      onClick={handleOverlayClick}
    >
      <div className="status-confirm-content">
        <h3>Confirm Status Change</h3>
        <p>
          Are you sure you want to {actionText} the trail "{trailName}"? 
          {newStatus === 'closed' 
            ? ' This will make it unavailable to other users.' 
            : ' This will make it available to other users again.'
          }
        </p>
        <div className="status-confirm-actions">
          <button 
            className="status-confirm-btn cancel" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="status-confirm-btn confirm" 
            onClick={onConfirm}
          >
            {newStatus === 'closed' ? 'Close Trail' : 'Reopen Trail'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusConfirmModal;

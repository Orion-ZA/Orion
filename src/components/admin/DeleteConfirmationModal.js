import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import './ModalComponents.css';

const DeleteConfirmationModal = ({ 
  isVisible, 
  deleteConfirm, 
  onConfirm, 
  onCancel 
}) => {
  console.log('DeleteConfirmationModal render - isVisible:', isVisible, 'deleteConfirm:', deleteConfirm);
  
  if (!isVisible || !deleteConfirm) return null;

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal-content">
        <div className="modal-header">
          <AlertTriangle className="modal-icon" />
          <h3>Confirm Deletion</h3>
        </div>
        
        <div className="modal-body">
          {deleteConfirm.type === 'review' ? (
            <>
              <p>Are you sure you want to delete this review?</p>
              <div className="delete-preview">
                <p className="preview-trail">Trail: {String(deleteConfirm.trailName || 'Unknown')}</p>
                <p className="preview-rating">Rating: {typeof deleteConfirm.rating === 'number' ? deleteConfirm.rating : 0}/5</p>
                {deleteConfirm.comment && (
                  <p className="preview-comment">"{String(deleteConfirm.comment)}"</p>
                )}
                {deleteConfirm.message && !deleteConfirm.comment && (
                  <p className="preview-comment">"{String(deleteConfirm.message)}"</p>
                )}
              </div>
            </>
          ) : deleteConfirm.type === 'alert' ? (
            <>
              <p>Are you sure you want to delete this alert?</p>
              <div className="delete-preview">
                <p className="preview-message">"{String(deleteConfirm.message || deleteConfirm.comment)}"</p>
                <p className="preview-type">Type: {String(deleteConfirm.type || 'Unknown')}</p>
              </div>
            </>
          ) : (
            <>
              <p>Are you sure you want to delete the trail "{String(deleteConfirm.name || 'Unknown')}"?</p>
              <p className="warning-text">This action cannot be undone and will also delete all associated reviews.</p>
            </>
          )}
        </div>
        
        <div className="modal-footer">
          <button onClick={onCancel} className="cancel-button">
            Cancel
          </button>
          <button onClick={onConfirm} className="confirm-delete-button">
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;

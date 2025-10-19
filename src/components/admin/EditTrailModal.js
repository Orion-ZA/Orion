import React from 'react';
import { X, Trash2, Image as ImageIcon } from 'lucide-react';
import './ModalComponents.css';

const EditTrailModal = ({
  isVisible,
  editTrail,
  editForm,
  onClose,
  onSave,
  onFormChange,
  onRemoveImage,
}) => {
  console.log('EditTrailModal render - isVisible:', isVisible, 'editTrail:', editTrail);

  if (!isVisible || !editTrail) return null;

  return (
    <div className='edit-modal-overlay'>
      <div className='edit-modal'>
        <div className='edit-modal-header'>
          <h3>Edit Trail</h3>
          <button onClick={onClose} className='close-button'>
            <X size={20} />
          </button>
        </div>

        <form
          className='edit-form'
          onSubmit={e => {
            e.preventDefault();
            onSave();
          }}
        >
          <div className='form-group'>
            <label htmlFor='name'>Trail Name</label>
            <input
              type='text'
              id='name'
              value={editForm.name}
              onChange={e => onFormChange('name', e.target.value)}
              required
            />
          </div>

          <div className='form-group'>
            <label htmlFor='description'>Description</label>
            <textarea
              id='description'
              value={editForm.description}
              onChange={e => onFormChange('description', e.target.value)}
              rows={4}
            />
          </div>

          <div className='form-group'>
            <label htmlFor='difficulty'>Difficulty</label>
            <select
              id='difficulty'
              value={editForm.difficulty}
              onChange={e => onFormChange('difficulty', e.target.value)}
            >
              <option value='Easy'>Easy</option>
              <option value='Moderate'>Moderate</option>
              <option value='Hard'>Hard</option>
            </select>
          </div>

          <div className='form-group'>
            <label htmlFor='distance'>
              Distance (km) <span className='auto-filled-label'>(Auto-filled)</span>
            </label>
            <input
              type='number'
              id='distance'
              value={editForm.distance}
              onChange={e => onFormChange('distance', parseFloat(e.target.value))}
              step='0.1'
              min='0'
              disabled
              className='disabled-input'
            />
          </div>

          <div className='form-group'>
            <label htmlFor='elevationGain'>Elevation Gain (m)</label>
            <input
              type='number'
              id='elevationGain'
              value={editForm.elevationGain}
              onChange={e => onFormChange('elevationGain', parseFloat(e.target.value))}
              step='1'
              min='0'
            />
          </div>

          <div className='form-group'>
            <label htmlFor='tags'>Tags (comma-separated)</label>
            <input
              type='text'
              id='tags'
              value={editForm.tags}
              onChange={e => onFormChange('tags', e.target.value)}
              placeholder='e.g., waterfall, forest, scenic'
            />
          </div>

          <div className='form-group'>
            <label htmlFor='status'>Status</label>
            <select
              id='status'
              value={editForm.status}
              onChange={e => onFormChange('status', e.target.value)}
            >
              <option value='open'>Open</option>
              <option value='closed'>Closed</option>
              <option value='maintenance'>Under Maintenance</option>
            </select>
          </div>

          {/* Trail Images Management */}
          {editTrail.photos && editTrail.photos.length > 0 && (
            <div className='form-group'>
              <label>
                <ImageIcon size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Trail Images ({editTrail.photos.length})
              </label>
              <div className='edit-modal-images-grid'>
                {editTrail.photos.map((photo, index) => (
                  <div key={index} className='edit-modal-image-item'>
                    <img
                      src={photo}
                      alt={`Trail image ${index + 1}`}
                      className='edit-modal-image'
                    />
                    <button
                      type='button'
                      className='edit-modal-remove-image-btn'
                      onClick={() => onRemoveImage(index)}
                      title='Remove this image'
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <p className='edit-modal-images-note'>
                Click the trash icon to remove an image. Changes will be saved when you click "Save
                Changes".
              </p>
            </div>
          )}

          <div className='modal-footer'>
            <button type='button' onClick={onClose} className='cancel-button'>
              Cancel
            </button>
            <button type='submit' className='save-button'>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTrailModal;

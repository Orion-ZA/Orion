import React, { useState, useCallback } from 'react';
import './TrailSubmission.css';

// Simple Badge component with selectable logic
function Badge({ selected, onClick, children }) {
  return (
    <span
      className={`badge ${selected ? 'badge-selected' : 'badge-unselected'}`}
      onClick={onClick}
    >
      {children}
    </span>
  );
}

// Map placeholder component
function MapPlaceholder() {
  return (
    <div className="map-placeholder">
      <div className="map-placeholder-content">
        <svg 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <p>Map will appear here</p>
        <p className="map-placeholder-subtext">Select location to place marker</p>
      </div>
    </div>
  );
}

// Photo Preview Component
function PhotoPreview({ file, onRemove }) {
  const [imageUrl, setImageUrl] = useState(null);

  // Create object URL for preview
  React.useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className="photo-preview">
      <img src={imageUrl} alt={file.name} />
      <button 
        type="button" 
        className="remove-photo-btn"
        onClick={() => onRemove(file)}
        aria-label={`Remove ${file.name}`}
      >
        ×
      </button>
      <div className="photo-name">{file.name}</div>
    </div>
  );
}

// Modal for photo upload with drag and drop
function PhotoUploadModal({ open, onClose, onUpload }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (fileToRemove) => {
    setFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  const handleUpload = () => {
    onUpload(files);
    setFiles([]);
    onClose();
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  if (!open) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Upload Photos</h2>
        
        {/* Drag and drop area */}
        <div 
          className={`drop-zone ${isDragging ? 'drop-zone-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="drop-zone-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <p>Drag & drop photos here or click to browse</p>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange}
              className="drop-zone-input"
            />
          </div>
        </div>

        {/* File input alternative */}
        <div style={{ marginTop: '1rem' }}>
          <label className="browse-files-btn">
            Browse files
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Preview area */}
        {files.length > 0 && (
          <div className="photos-preview">
            <h3>Selected Photos ({files.length})</h3>
            <div className="preview-grid">
              {files.map((file, idx) => (
                <PhotoPreview 
                  key={`${file.name}-${idx}`} 
                  file={file} 
                  onRemove={handleRemoveFile}
                />
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="button" onClick={handleUpload} disabled={files.length === 0}>
            Upload {files.length > 0 && `(${files.length})`}
          </button>
          <button className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrailSubmission() {
  const featureList = [
    "Waterfall",
    "Lake View",
    "Mountain Peak",
    "Wildlife",
    "Historic Site",
    "Rock Formations",
    "Forest Trail",
    "Desert Trail",
    "River Crossing",
    "Scenic Overlook",
    "Wildflowers",
    "Cave",
  ];

  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photos, setPhotos] = useState([]);

  const handleFeatureClick = (feature) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const handlePhotoUpload = (files) => {
    setPhotos((prev) => [...prev, ...files]);
  };

  const handleRemoveUploadedPhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container fade-in-up trail-submission">
      <h1>Trail Submission</h1>
      <div className="trail-submission-layout">
        {/* Map placeholder on the left */}
        <div className="trail-map-section">
          <MapPlaceholder />
        </div>
        
        {/* Form on the right */}
        <div className="trail-form-section">
          <h3>Trail Information</h3>
          <div className="trail-form-grid">
            <div className="form-field">
              <label>Name</label>
              <input className="input" placeholder="Trail name" />
            </div>
            <div className="form-field">
              <label>Location</label>
              <input className="input" placeholder="City, State" />
            </div>
            <div className="form-field">
              <label>Distance (mi)</label>
              <input className="input" type="number" placeholder="10" />
            </div>
            <div className="form-field">
              <label>Elevation Gain</label>
              <input className="input" type="number" placeholder="eg 1000 ft" />
            </div>
            <div className="form-field">
              <label>Difficulty</label>
              <select className="input">
                <option>Easy</option>
                <option>Moderate</option>
                <option>Hard</option>
              </select>
            </div>
            <div className="form-field full-width">
              <label>Review</label>
              <textarea className="input" rows="4" placeholder="Trail highlights, terrain, best season..." />
            </div>
            <div className="form-field full-width">
              <label>Trail Features<p className="muted">Select all that apply</p></label>
              <div className="features-container">
                {featureList.map((feature) => (
                  <Badge
                    key={feature}
                    selected={selectedFeatures.includes(feature)}
                    onClick={() => handleFeatureClick(feature)}
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="form-field">
              <button className="button" type="button" onClick={() => setPhotoModalOpen(true)}>
                Add Photos {photos.length > 0 && `(${photos.length})`}
              </button>
              {photos.length > 0 && (
                <div className="photo-list">
                  <strong>Uploaded Photos:</strong>
                  <div className="uploaded-photos-grid">
                    {photos.map((file, idx) => (
                      <PhotoPreview 
                        key={`uploaded-${file.name}-${idx}`}
                        file={file}
                        onRemove={() => handleRemoveUploadedPhoto(idx)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="form-field full-width">
              <button className="button button-submit">Submit Trail</button>
            </div>
          </div>
        </div>
      </div>
      <PhotoUploadModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onUpload={handlePhotoUpload}
      />
    </div>
  );
}
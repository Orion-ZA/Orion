import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, CheckCircle, AlertCircle, Loader2, MapPin, Map, Edit3, Trash2, Play, Square, Ruler, Image as ImageIcon } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebaseConfig";
import { v4 as uuidv4 } from "uuid";
import { calculateRouteDistance, formatFileSize } from './TrailUtils';
import './TrailSubmission.css';

const TrailSubmission = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  submitStatus,
  selectedLocation,
  onLocationSelect,
  onRouteUpdate
}) => {
  const [placeInput, setPlaceInput] = useState('');
  const [trailName, setTrailName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [distance, setDistance] = useState('');
  const [elevationGain, setElevationGain] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [images, setImages] = useState([]);
  
  // Trail drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [drawingMode, setDrawingMode] = useState('click'); // 'click' or 'track'

  // Reset form when panel closes
  useEffect(() => {
    if (!isOpen) {
      setPlaceInput('');
      setTrailName('');
      setDescription('');
      setDifficulty('');
      setDistance('');
      setElevationGain('');
      setTags([]);
      setTagInput('');
      setImages([]);
      setIsDrawing(false);
      setRoutePoints([]);
      setDrawingMode('click');
    }
  }, [isOpen]);

  // Update route in parent component
  useEffect(() => {
    if (onRouteUpdate) {
      onRouteUpdate(routePoints, { addRoutePoint, isDrawing });
    }
  }, [routePoints, isDrawing]); // Removed onRouteUpdate from dependencies to prevent infinite loop

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedLocation || !trailName.trim() || !difficulty || !distance) {
      return;
    }

    try {
      // Upload images to Firebase Storage
      const uploadedImages = [];
      for (const image of images) {
        const imageRef = ref(storage, `trails/${uuidv4()}-${image.name}`);
        await uploadBytes(imageRef, image);
        const downloadURL = await getDownloadURL(imageRef);
        uploadedImages.push(downloadURL);
      }

      const trailData = {
        name: trailName,
        description: description || '',
        difficulty,
        distance: parseFloat(distance),
        elevationGain: elevationGain ? parseFloat(elevationGain) : 0,
        tags,
        photos: uploadedImages,
        location: {
          lat: selectedLocation.latitude,
          lng: selectedLocation.longitude
        },
        gpsRoute: routePoints.map(([lng, lat]) => ({ lat, lng })),
        status: 'open' // Default status for new trails
      };

      await onSubmit(trailData);
    } catch (error) {
      console.error('Error submitting trail:', error);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    // Clean up object URL to prevent memory leaks
    const imageToRemove = images[index];
    if (imageToRemove) {
      URL.revokeObjectURL(URL.createObjectURL(imageToRemove));
    }
    setImages(images.filter((_, i) => i !== index));
  };


  // Drawing control functions
  const startDrawing = () => {
    setIsDrawing(true);
    setRoutePoints([]);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearRoute = () => {
    setRoutePoints([]);
    if (onRouteUpdate) {
      onRouteUpdate([]);
    }
  };

  const addRoutePoint = (lng, lat) => {
    if (isDrawing) {
      const newPoint = [lng, lat];
      setRoutePoints(prev => [...prev, newPoint]);
    }
  };


  // Auto-fill distance when route points change
  useEffect(() => {
    if (routePoints.length >= 2) {
      const calculatedDistance = calculateRouteDistance(routePoints);
      setDistance(calculatedDistance.toFixed(2));
    }
  }, [routePoints]);

  // Cleanup object URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      images.forEach(image => {
        URL.revokeObjectURL(URL.createObjectURL(image));
      });
    };
  }, [images]);

  if (!isOpen) return null;

  return (
    <div className="submission-panel-side">
      <div className="submission-header">
        <h2>Submit New Trail</h2>
        <button onClick={onClose} className="close-btn">
          <X size={18} />
        </button>
      </div>

      {/* Location Selection Status */}
      <div className="location-status">
        {selectedLocation ? (
          <div className="location-selected">
            <MapPin size={16} />
            <span>Location selected: {selectedLocation.name || `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`}</span>
          </div>
        ) : (
          <div className="location-pending">
            <Map size={16} />
            <span>Click on the map to select a location</span>
          </div>
        )}
      </div>

      {/* Trail Drawing Controls */}
      <div className="drawing-controls">
        <div className="drawing-header">
          <h4>Trail Route</h4>
          <div className="route-stats">
            {routePoints.length > 0 && (
              <span className="route-points">{routePoints.length} points</span>
            )}
            {routePoints.length > 1 && (
              <span className="route-distance">{calculateRouteDistance(routePoints).toFixed(2)} km</span>
            )}
          </div>
        </div>
        
        <div className="drawing-buttons">
          {!isDrawing ? (
            <button
              type="button"
              onClick={startDrawing}
              className="drawing-btn start"
            >
              <Edit3 size={16} />
              Start Drawing
            </button>
          ) : (
            <button
              type="button"
              onClick={stopDrawing}
              className="drawing-btn stop"
            >
              <Square size={16} />
              Stop Drawing
            </button>
          )}
          
          {routePoints.length > 0 && (
            <button
              type="button"
              onClick={clearRoute}
              className="drawing-btn clear"
            >
              <Trash2 size={16} />
              Clear Route
            </button>
          )}
        </div>
        
        {isDrawing && (
          <div className="drawing-instructions">
            <p>Click on the map to add points to your trail route</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="submission-form">
        <div className="form-group">
          <label htmlFor="place">Place Name</label>
          <input
            type="text"
            id="place"
            value={placeInput}
            onChange={(e) => setPlaceInput(e.target.value)}
            placeholder="Enter place name (e.g., Table Mountain, Cape Town)"
          />
        </div>

          <div className="form-group">
            <label htmlFor="name">Trail Name *</label>
            <input
              type="text"
              id="name"
              value={trailName}
              onChange={(e) => setTrailName(e.target.value)}
              placeholder="Enter trail name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the trail..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="difficulty">Difficulty *</label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                required
              >
                <option value="">Select difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="distance">Distance (km) *</label>
              <div className="distance-input-container">
                <input
                  type="number"
                  id="distance"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="0.0"
                  step="0.1"
                  min="0"
                  required
                  className={routePoints.length >= 2 ? "auto-calculated" : ""}
                  readOnly={routePoints.length >= 2}
                />
                {routePoints.length >= 2 && (
                  <span className="auto-calculated-indicator" title="Auto-calculated from route">
                    <Ruler size={16} />
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="elevation">Elevation Gain (m)</label>
            <input
              type="number"
              id="elevation"
              value={elevationGain}
              onChange={(e) => setElevationGain(e.target.value)}
              placeholder="0"
              step="1"
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <div className="tag-input">
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button type="button" onClick={addTag} className="tag-add-btn">
                <Plus size={16} />
              </button>
            </div>
            <div className="tags-display">
              {tags.map((tag, index) => (
                <div key={index} className="tag-item">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="tag-remove"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="images">Photos</label>
            <div className="image-upload-container">
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
              />
              <label htmlFor="images" className="file-input-label">
                <Upload size={20} />
                <span>Choose Photos</span>
              </label>
              <div className="file-count">
                {images.length} file{images.length !== 1 ? 's' : ''} selected
              </div>
            </div>
            
            {/* Image Previews */}
            {images.length > 0 && (
              <div className="image-previews">
                {images.map((image, index) => (
                  <div key={index} className="image-preview-item">
                    <div className="image-preview">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="preview-image"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="remove-image-btn"
                        title="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="image-info">
                      <span className="image-name">{image.name}</span>
                      <span className="image-size">
                        {formatFileSize(image.size)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {submitStatus.type && (
            <div className={`submit-status ${submitStatus.type}`}>
              {submitStatus.type === 'success' ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {submitStatus.message}
            </div>
          )}

        <button
          type="submit"
          disabled={isSubmitting || !selectedLocation || !trailName.trim() || !difficulty || !distance}
          className="submit-btn"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Trail'
          )}
        </button>
      </form>
    </div>
  );
};

export default TrailSubmission;

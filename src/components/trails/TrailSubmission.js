import React, { useState } from 'react';
import { X, Upload, Plus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebaseConfig";
import { v4 as uuidv4 } from "uuid";
import './TrailSubmission.css';

const TrailSubmission = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  submitStatus
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!placeInput.trim() || !trailName.trim() || !difficulty || !distance) {
      return;
    }

    try {
      // Upload images to Firebase Storage
      const uploadedImages = [];
      for (const image of images) {
        const imageRef = ref(storage, `trail-images/${uuidv4()}`);
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
        location: placeInput
      };

      await onSubmit(trailData);
      
      // Reset form
      setPlaceInput('');
      setTrailName('');
      setDescription('');
      setDifficulty('');
      setDistance('');
      setElevationGain('');
      setTags([]);
      setTagInput('');
      setImages([]);
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
    setImages(images.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="submission-overlay">
      <div className="submission-panel">
        <div className="submission-header">
          <h2>Submit New Trail</h2>
          <button onClick={onClose} className="close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="submission-form">
          <div className="form-group">
            <label htmlFor="place">Location *</label>
            <input
              type="text"
              id="place"
              value={placeInput}
              onChange={(e) => setPlaceInput(e.target.value)}
              placeholder="Enter trail location (e.g., Table Mountain, Cape Town)"
              required
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
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="distance">Distance (km) *</label>
              <input
                type="number"
                id="distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="0.0"
                step="0.1"
                min="0"
                required
              />
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
            <input
              type="file"
              id="images"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
            />
            <div className="file-count">
              {images.length} file{images.length !== 1 ? 's' : ''} selected
            </div>
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
            disabled={isSubmitting || !placeInput.trim() || !trailName.trim() || !difficulty || !distance}
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
    </div>
  );
};

export default TrailSubmission;

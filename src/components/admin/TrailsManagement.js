import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Trash2, MapPin, Calendar, User, Star, AlertCircle, ChevronDown, ChevronRight, MessageSquare, AlertTriangle, Edit } from 'lucide-react';
import './TrailsManagement.css';

export default function TrailsManagement() {
  const [trails, setTrails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedTrails, setExpandedTrails] = useState({});
  const [trailReviews, setTrailReviews] = useState({});
  const [trailAlerts, setTrailAlerts] = useState({});
  const [trailCounts, setTrailCounts] = useState({});
  const [editTrail, setEditTrail] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchTrails();
  }, []);

  // Fetch counts for all trails when trails are loaded
  useEffect(() => {
    if (trails.length > 0) {
      fetchAllTrailCounts();
    }
  }, [trails]);

  const fetchTrails = async () => {
    try {
      setLoading(true);
      const trailsRef = collection(db, 'Trails');
      const q = query(trailsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const trailsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTrails(trailsData);
    } catch (err) {
      setError('Failed to fetch trails: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTrailCounts = async () => {
    const counts = {};
    
    for (const trail of trails) {
      try {
        // Fetch reviews count
        const reviewsRef = collection(db, 'Trails', trail.id, 'reviews');
        const reviewsSnapshot = await getDocs(reviewsRef);
        const reviewsCount = reviewsSnapshot.size;
        
        // Fetch alerts count
        const alertsRef = collection(db, 'Alerts');
        const alertsQuery = query(alertsRef, where('trailId', '==', trail.id));
        const alertsSnapshot = await getDocs(alertsQuery);
        const alertsCount = alertsSnapshot.size;
        
        counts[trail.id] = {
          reviews: reviewsCount,
          alerts: alertsCount
        };
      } catch (err) {
        console.error(`Error fetching counts for trail ${trail.id}:`, err);
        counts[trail.id] = {
          reviews: 0,
          alerts: 0
        };
      }
    }
    
    setTrailCounts(counts);
  };

  const fetchTrailReviews = async (trailId) => {
    try {
      const reviewsRef = collection(db, 'Trails', trailId, 'reviews');
      const q = query(reviewsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        trailId: trailId,
        ...doc.data()
      }));
      
      setTrailReviews(prev => ({
        ...prev,
        [trailId]: reviewsData
      }));
    } catch (err) {
      console.warn(`Failed to fetch reviews for trail ${trailId}:`, err.message);
    }
  };

  const fetchTrailAlerts = async (trailId) => {
    try {
      const alertsRef = collection(db, 'Alerts');
      const q = query(alertsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const alertsData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(alert => alert.trailId === trailId);
      
      setTrailAlerts(prev => ({
        ...prev,
        [trailId]: alertsData
      }));
    } catch (err) {
      console.warn(`Failed to fetch alerts for trail ${trailId}:`, err.message);
    }
  };

  const toggleTrailExpansion = async (trailId) => {
    const isExpanded = expandedTrails[trailId];
    setExpandedTrails(prev => ({
      ...prev,
      [trailId]: !isExpanded
    }));

    // Fetch data when expanding for the first time
    if (!isExpanded) {
      await Promise.all([
        fetchTrailReviews(trailId),
        fetchTrailAlerts(trailId)
      ]);
    }
  };

  const handleDeleteTrail = async (trailId, trailName) => {
    try {
      await deleteDoc(doc(db, 'Trails', trailId));
      setTrails(trails.filter(trail => trail.id !== trailId));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete trail: ' + err.message);
    }
  };

  const handleDeleteReview = async (reviewId, trailId) => {
    try {
      await deleteDoc(doc(db, 'Trails', trailId, 'reviews', reviewId));
      setTrailReviews(prev => ({
        ...prev,
        [trailId]: prev[trailId]?.filter(review => review.id !== reviewId) || []
      }));
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete review: ' + err.message);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await deleteDoc(doc(db, 'Alerts', alertId));
      // Update all trail alerts
      setTrailAlerts(prev => {
        const updated = {};
        Object.keys(prev).forEach(trailId => {
          updated[trailId] = prev[trailId].filter(alert => alert.id !== alertId);
        });
        return updated;
      });
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete alert: ' + err.message);
    }
  };

  const handleEditTrail = (trail) => {
    setEditTrail(trail);
    setEditForm({
      name: trail.name || '',
      description: trail.description || '',
      distance: trail.distance || '',
      elevationGain: trail.elevationGain || '',
      difficulty: trail.difficulty || '',
      status: trail.status || 'open',
      tags: trail.tags ? trail.tags.join(', ') : ''
    });
  };

  const handleUpdateTrail = async () => {
    try {
      const trailRef = doc(db, 'Trails', editTrail.id);
      const updateData = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        distance: editForm.distance ? parseFloat(editForm.distance) : null,
        elevationGain: editForm.elevationGain ? parseFloat(editForm.elevationGain) : null,
        difficulty: editForm.difficulty,
        status: editForm.status,
        tags: editForm.tags ? editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        lastUpdated: new Date()
      };

      await updateDoc(trailRef, updateData);
      
      // Update local state
      setTrails(trails.map(trail => 
        trail.id === editTrail.id 
          ? { ...trail, ...updateData }
          : trail
      ));
      
      setEditTrail(null);
      setEditForm({});
    } catch (err) {
      setError('Failed to update trail: ' + err.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatLocation = (location) => {
    if (!location) return 'N/A';
    return `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`;
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={`admin-star ${i <= rating ? 'filled' : 'empty'}`}
        />
      );
    }
    return stars;
  };

  const getAlertTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'community':
        return '#007aff';
      case 'authority':
        return '#ff9500';
      case 'emergency':
        return '#ff3b30';
      default:
        return '#a0a0a0';
    }
  };

  if (loading) {
    return (
      <div className="trails-management">
        <div className="trails-loading">
          <div className="loading-spinner"></div>
          <p>Loading trails...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trails-management">
        <div className="trails-error">
          <AlertCircle className="error-icon" />
          <p>{error}</p>
          <button onClick={fetchTrails} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="trails-management">
      <div className="trails-header">
        <h2>Trails Management</h2>
        <div className="trails-stats">
          <span className="stat-item">
            <MapPin className="stat-icon" />
            Total Trails: {trails.length}
          </span>
        </div>
      </div>

      <div className="trails-list">
        {trails.length === 0 ? (
          <div className="no-trails">
            <MapPin className="no-trails-icon" />
            <p>No trails found</p>
          </div>
        ) : (
          trails.map((trail) => {
            const isExpanded = expandedTrails[trail.id];
            const reviews = trailReviews[trail.id] || [];
            const alerts = trailAlerts[trail.id] || [];
            
            return (
              <div key={trail.id} className="trail-card">
                <div className="trail-header">
                  <div className="trail-title-section">
                    <button
                      onClick={() => toggleTrailExpansion(trail.id)}
                      className="expand-button"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? <ChevronDown className="expand-icon" /> : <ChevronRight className="expand-icon" />}
                    </button>
                    <h3 className="trail-name">{trail.name || 'Unnamed Trail'}</h3>
                  </div>
                  <div className="trail-actions">
                    <button
                      onClick={() => handleEditTrail(trail)}
                      className="edit-button"
                      title="Edit Trail"
                    >
                      <Edit className="edit-icon" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(trail)}
                      className="delete-button"
                      title="Delete Trail"
                    >
                      <Trash2 className="delete-icon" />
                    </button>
                  </div>
                </div>
                
                <div className="trail-details">
                  <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{formatLocation(trail.location)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Distance:</span>
                    <span className="detail-value">{trail.distance ? `${trail.distance} km` : 'N/A'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Difficulty:</span>
                    <span className={`detail-value difficulty-${trail.difficulty?.toLowerCase()}`}>
                      {trail.difficulty || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value status-${trail.status?.toLowerCase()}`}>
                      {trail.status || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{formatDate(trail.createdAt)}</span>
                  </div>
                  
                  {trail.description && (
                    <div className="detail-row full-width">
                      <span className="detail-label">Description:</span>
                      <span className="detail-value description">{trail.description}</span>
                    </div>
                  )}
                  
                  {trail.tags && trail.tags.length > 0 && (
                    <div className="detail-row full-width">
                      <span className="detail-label">Tags:</span>
                      <div className="tags-container">
                        {trail.tags.map((tag, index) => (
                          <span key={index} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="trail-expanded-content">
                    {/* Reviews Section */}
                    <div className="content-section">
                      <div className="section-header">
                        <MessageSquare className="section-icon" />
                        <h4>Reviews ({reviews.length})</h4>
                      </div>
                      <div className="scrollable-container">
                        {reviews.length === 0 ? (
                          <div className="empty-section">
                            <p>No reviews yet</p>
                          </div>
                        ) : (
                          reviews.map((review) => (
                            <div key={review.id} className="review-item">
                              <div className="review-header">
                                <div className="review-rating">
                                  {renderStars(review.rating || 0)}
                                  <span className="rating-text">({review.rating || 0}/5)</span>
                                </div>
                                <button
                                  onClick={() => setDeleteConfirm({...review, type: 'review', trailName: trail.name})}
                                  className="delete-small-button"
                                  title="Delete Review"
                                >
                                  <Trash2 className="delete-icon" />
                                </button>
                              </div>
                              <p className={`review-comment ${!review.comment ? 'no-comment' : ''}`}>
                                {review.comment ? `"${review.comment}"` : "No comment provided"}
                              </p>
                              <div className="review-meta">
                                <span className="review-user">User: {review.userId || 'Unknown'}</span>
                                <span className="review-date">{formatDate(review.timestamp)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Alerts Section */}
                    <div className="content-section">
                      <div className="section-header">
                        <AlertTriangle className="section-icon" />
                        <h4>Alerts ({alerts.length})</h4>
                      </div>
                      <div className="scrollable-container">
                        {alerts.length === 0 ? (
                          <div className="empty-section">
                            <p>No alerts for this trail</p>
                          </div>
                        ) : (
                          alerts.map((alert) => (
                            <div key={alert.id} className={`alert-item ${alert.isActive ? 'active' : 'inactive'}`}>
                              <div className="alert-header">
                                <div className="alert-type">
                                  <span 
                                    className="alert-type-text"
                                    style={{ color: getAlertTypeColor(alert.type) }}
                                  >
                                    {alert.type || 'Unknown'}
                                  </span>
                                  <span className={`alert-status ${alert.isActive ? 'active' : 'inactive'}`}>
                                    {alert.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setDeleteConfirm({...alert, type: 'alert'})}
                                  className="delete-small-button"
                                  title="Delete Alert"
                                >
                                  <Trash2 className="delete-icon" />
                                </button>
                              </div>
                              <p className="alert-message">{alert.message || 'No message'}</p>
                              <div className="alert-meta">
                                <span className="alert-date">{formatDate(alert.timestamp)}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Trail Counters - Bottom Right */}
                <div className="trail-counters-bottom">
                  <div className="counter-item">
                    <MessageSquare className="counter-icon" />
                    <span className="counter-text">{trailCounts[trail.id]?.reviews || 0}</span>
                  </div>
                  <div className="counter-item">
                    <AlertTriangle className="counter-icon" />
                    <span className="counter-text">{trailCounts[trail.id]?.alerts || 0}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {deleteConfirm && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <h3>Confirm Deletion</h3>
            {deleteConfirm.type === 'review' ? (
              <>
                <p>Are you sure you want to delete this review?</p>
                <div className="delete-preview">
                  <p className="preview-trail">Trail: {deleteConfirm.trailName}</p>
                  <p className="preview-rating">Rating: {deleteConfirm.rating}/5</p>
                  {deleteConfirm.comment && (
                    <p className="preview-comment">"{deleteConfirm.comment}"</p>
                  )}
                </div>
              </>
            ) : deleteConfirm.type === 'alert' ? (
              <>
                <p>Are you sure you want to delete this alert?</p>
                <div className="delete-preview">
                  <p className="preview-message">"{deleteConfirm.message}"</p>
                  <p className="preview-type">Type: {deleteConfirm.type}</p>
                </div>
              </>
            ) : (
              <>
                <p>Are you sure you want to delete the trail "{deleteConfirm.name}"?</p>
                <p className="warning-text">This action cannot be undone and will also delete all associated reviews.</p>
              </>
            )}
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'review') {
                    handleDeleteReview(deleteConfirm.id, deleteConfirm.trailId);
                  } else if (deleteConfirm.type === 'alert') {
                    handleDeleteAlert(deleteConfirm.id);
                  } else {
                    handleDeleteTrail(deleteConfirm.id, deleteConfirm.name);
                  }
                }}
                className="confirm-delete-button"
              >
                Delete {deleteConfirm.type === 'review' ? 'Review' : deleteConfirm.type === 'alert' ? 'Alert' : 'Trail'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editTrail && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <h3>Edit Trail</h3>
            <div className="edit-form">
              <div className="form-group">
                <label htmlFor="trail-name">Trail Name</label>
                <input
                  id="trail-name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Enter trail name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="trail-description">Description</label>
                <textarea
                  id="trail-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Enter trail description"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="trail-distance">Distance (km)</label>
                  <input
                    id="trail-distance"
                    type="number"
                    step="0.1"
                    value={editForm.distance}
                    onChange={(e) => setEditForm({...editForm, distance: e.target.value})}
                    placeholder="0.0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="trail-elevation">Elevation Gain (m)</label>
                  <input
                    id="trail-elevation"
                    type="number"
                    step="1"
                    value={editForm.elevationGain}
                    onChange={(e) => setEditForm({...editForm, elevationGain: e.target.value})}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="trail-difficulty">Difficulty</label>
                  <select
                    id="trail-difficulty"
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm({...editForm, difficulty: e.target.value})}
                  >
                    <option value="">Select difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="trail-status">Status</label>
                  <select
                    id="trail-status"
                    value={editForm.status}
                    onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="trail-tags">Tags (comma-separated)</label>
                <input
                  id="trail-tags"
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
                  placeholder="forest, waterfall, scenic"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => {
                  setEditTrail(null);
                  setEditForm({});
                }}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTrail}
                className="save-button"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Heart, CheckCircle, Bookmark, Upload, Mountain, Lock, Unlock } from 'lucide-react';
import { getDifficultyColor, getDifficultyIcon } from '../components/trails/TrailUtils';
import './MyTrails.css';

// Status Confirmation Modal Component
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

// Modal Component
const ReviewModal = ({ trailName, isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    // Prevent body scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'static';
    }
    
    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'static';
    };
  }, [isOpen]);

  const handleSubmit = () => {
    if (rating < 1 || rating > 5) {
      alert("Please enter a rating between 1 and 5");
      return;
    }
    onSubmit(rating, comment);
    setRating(5);
    setComment('');
  };

  const handleClose = () => {
    onClose();
    setRating(5);
    setComment('');
  };

  // Handle overlay click (close modal when clicking outside content)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div 
      className={`modal-overlay ${isOpen ? 'open' : ''}`} 
      onClick={handleOverlayClick}
    >
      <div className="modal-content">
        <button className="modal-close-btn" onClick={handleClose} aria-label="Close modal">
          ×
        </button>
        <h3>Review: {trailName}</h3>
        
        <div className="input-group">
          <label>
            Rating (1-5)
          </label>
          <div className="rating-input">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star ${rating >= star ? 'active' : ''}`}
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div className="input-group">
          <label>
            Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows="4"
          />
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit}>
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default function MyTrails() {
  const [trails, setTrails] = useState({ favourites: [], completed: [], wishlist: [], submitted: [] });
  const [alerts, setAlerts] = useState({});
  const [modalState, setModalState] = useState({
    isOpen: false,
    trailId: null,
    trailName: '',
  });
  const [statusConfirmState, setStatusConfirmState] = useState({
    isOpen: false,
    trailId: null,
    trailName: '',
    currentStatus: 'open',
  });
  const [activeTab, setActiveTab] = useState('favourites');
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  useEffect(() => {
    async function fetchSavedTrails() {
      if (!userId) return;
      
      try {
        setLoading(true);
        
        // Fetch saved trails from the API
        const res = await fetch(`https://getsavedtrails-fqtduxc7ua-uc.a.run.app?uid=${userId}`);
        const data = await res.json();
        
        // Fetch submitted trails from Firestore
        const userRef = doc(db, 'Users', userId);
        const userSnap = await getDoc(userRef);
        let submittedTrails = [];
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          console.log('User data:', userData);
          console.log('Submitted trails array:', userData.submittedTrails);
          
          if (userData.submittedTrails && userData.submittedTrails.length > 0) {
            const fetchTrailDetails = async (references) => {
              const details = [];
              console.log('Processing submitted trail references:', references);
              
              for (const ref of references) {
                try {
                  console.log('Processing reference:', ref, 'Type:', typeof ref);
                  let trailDoc;
                  
                  if (typeof ref === 'string') {
                    // Handle string path like "/Trails/trailId"
                    if (ref.startsWith('/Trails/')) {
                      const trailId = ref.split('/')[2];
                      trailDoc = await getDoc(doc(db, 'Trails', trailId));
                    }
                  } else if (ref && ref.path) {
                    // Handle Firestore DocumentReference
                    trailDoc = await getDoc(ref);
                  } else if (ref && ref._path) {
                    // Handle Firestore DocumentReference with _path
                    const pathParts = ref._path.segments;
                    if (pathParts[0] === 'Trails') {
                      trailDoc = await getDoc(doc(db, 'Trails', pathParts[1]));
                    }
                  }
                  
                  if (trailDoc && trailDoc.exists()) {
                    const trailData = trailDoc.data();
                    details.push({ 
                      id: trailDoc.id, 
                      ...trailData,
                      // Ensure we have the required fields for display
                      name: trailData.name || 'Unnamed Trail',
                      difficulty: trailData.difficulty || 'Unknown',
                      distance: trailData.distance || 0,
                      elevationGain: trailData.elevationGain || 0,
                      status: trailData.status || 'open',
                      createdAt: trailData.createdAt || trailData.lastUpdated
                    });
                  }
                } catch (error) {
                  console.error('Error fetching trail details:', error);
                }
              }
              return details;
            };
            
            submittedTrails = await fetchTrailDetails(userData.submittedTrails);
            console.log('Fetched submitted trails:', submittedTrails);
          }
        }
        
        console.log('Final trails state:', { ...data, submitted: submittedTrails });
        setTrails({ ...data, submitted: submittedTrails });

        const allTrails = [...data.favourites, ...data.completed, ...data.wishlist, ...submittedTrails];
        const alertsData = {};

        await Promise.all(
          allTrails.map(async (trail) => {
            try {
              const res = await fetch(
                `https://us-central1-orion-sdp.cloudfunctions.net/getAlerts?trailId=${trail.id}`
              );
              const alertData = await res.json();
              alertsData[trail.id] = alertData.alerts || [];
            } catch (err) {
              console.error(`Error fetching alerts for ${trail.name}:`, err);
              alertsData[trail.id] = [];
            }
          })
        );

        setAlerts(alertsData);
      } catch (err) {
        console.error('Error fetching saved trails:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSavedTrails();
  }, [userId]);


  const openReviewModal = (trailId, trailName) => {
    setModalState({
      isOpen: true,
      trailId,
      trailName,
    });
  };

  const closeReviewModal = () => {
    setModalState({
      isOpen: false,
      trailId: null,
      trailName: '',
    });
  };

  const openStatusConfirmModal = (trailId, trailName, currentStatus) => {
    setStatusConfirmState({
      isOpen: true,
      trailId,
      trailName,
      currentStatus,
    });
  };

  const closeStatusConfirmModal = () => {
    setStatusConfirmState({
      isOpen: false,
      trailId: null,
      trailName: '',
      currentStatus: 'open',
    });
  };

  const handleStatusChange = async () => {
    try {
      const { trailId, currentStatus } = statusConfirmState;
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';

      // Update the trail status in Firestore
      const trailRef = doc(db, 'Trails', trailId);
      await updateDoc(trailRef, {
        status: newStatus,
        lastUpdated: new Date().toISOString()
      });

      // Update local state
      setTrails((prev) => ({
        ...prev,
        submitted: prev.submitted.map((trail) =>
          trail.id === trailId ? { ...trail, status: newStatus } : trail
        ),
      }));

      closeStatusConfirmModal();
      alert(`Trail ${newStatus === 'closed' ? 'closed' : 'reopened'} successfully!`);
    } catch (err) {
      console.error('Failed to update trail status:', err);
      alert('Failed to update trail status. Please try again.');
    }
  };

  const handleMarkAsCompleted = async (rating, comment) => {
    try {
      const { trailId } = modalState;

      // Generate a unique ID for the review
      const generateId = () => {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
      };

      // Mark trail as completed
      await fetch("https://us-central1-orion-sdp.cloudfunctions.net/markCompleted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userId, trailId }),
      });

      // Add review to the trail
      const reviewResponse = await fetch(
        "https://us-central1-orion-sdp.cloudfunctions.net/addTrailReview",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trailId: trailId,
            review: {
              id: generateId(),
              rating: rating,
              comment: comment,
              timestamp: new Date().toISOString(),
              userId: userId,
              userName: user?.displayName || "Anonymous User"
            }
          }),
        }
      );

      const result = await reviewResponse.json();

      if (!reviewResponse.ok) {
        throw new Error(result.error || `Server returned ${reviewResponse.status}`);
      }

      // Update local state
      setTrails((prev) => {
        const trail =
          prev.favourites.find((t) => t.id === trailId) ||
          prev.wishlist.find((t) => t.id === trailId);

        if (!trail) return prev;

        return {
          ...prev,
          favourites: prev.favourites.filter((t) => t.id !== trailId),
          wishlist: prev.wishlist.filter((t) => t.id !== trailId),
          completed: [...prev.completed, trail],
        };
      });

      closeReviewModal();
      alert("Trail marked as completed and review submitted!");

    } catch (err) {
      console.error("Failed to mark trail as completed and add review:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  // Render trail list for the current active tab
  const renderTrailList = () => {
    const trailArray = trails[activeTab] || [];
    
    if (trailArray.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">
            {activeTab === 'favourites' && <Heart size={48} />}
            {activeTab === 'completed' && <CheckCircle size={48} />}
            {activeTab === 'wishlist' && <Bookmark size={48} />}
            {activeTab === 'submitted' && <Upload size={48} />}
            {!['favourites', 'completed', 'wishlist', 'submitted'].includes(activeTab) && <Mountain size={48} />}
          </div>
          <p>No trails in your {activeTab} yet.</p>
          <p className="empty-subtext">
            {activeTab === 'submitted' 
              ? 'Submit your first trail to see it here!' 
              : 'Start exploring to add trails to your collection!'
            }
          </p>
        </div>
      );
    }
    
    return trailArray.map((trail) => (
      <li key={trail.id} className="trail-card">
        <div className="trail-header">
          <h4>{trail.name}</h4>
        </div>

        {/* Alerts */}
        {alerts[trail.id] && alerts[trail.id].length > 0 && (
          <div className="alerts-container">
            {alerts[trail.id].map((alert) => (
              <div key={alert.id} className="alert-item">
                <span className="alert-type">[{alert.type}]</span> {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* Status Badge - Only for submitted trails */}
        {activeTab === 'submitted' && (
          <div className="trail-status">
            <span 
              className={`status-badge ${trail.status === 'open' ? 'status-open' : 'status-closed'}`}
              onClick={() => openStatusConfirmModal(trail.id, trail.name, trail.status)}
              title={`Click to ${trail.status === 'open' ? 'close' : 'reopen'} trail`}
            >
              {trail.status === 'open' ? (
                <>
                  <Unlock size={14} style={{ marginRight: '4px', display: 'inline-block' }} />
                  Open
                </>
              ) : (
                <>
                  <Lock size={14} style={{ marginRight: '4px', display: 'inline-block' }} />
                  Closed
                </>
              )}
            </span>
          </div>
        )}

        {/* Trail Info */}
        <div className="trail-info">
          <div className="trail-details">
            <span 
              className="trail-difficulty"
              style={{ backgroundColor: getDifficultyColor(trail.difficulty) }}
            >
              <span className="trail-difficulty-icon">
                {getDifficultyIcon(trail.difficulty)}
              </span>
              {trail.difficulty}
            </span>
            <span className="trail-distance">{trail.distance} km</span>
            {trail.elevationGain && (
              <span className="trail-elevation">+{trail.elevationGain}m</span>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="trail-actions">
          {activeTab !== "completed" && activeTab !== "submitted" && (
            <button
              className="complete-btn"
              onClick={() => openReviewModal(trail.id, trail.name)}
            >
              Mark as Completed
            </button>
          )}
          {activeTab === "submitted" && (
            <div className="submitted-actions">
              <span className="submitted-date">
                Submitted: {new Date(trail.createdAt?.toDate?.() || trail.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </li>
    ));
  };

  return (
    <div className="my-trails-container">
      <header className="page-header">
        <h1>My Trails</h1>
      </header>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your trails...</p>
        </div>
      ) : (
        <>
          <div className="tabs-scroll-container">
            <div className="tabs-container">
              <button 
                className={`tab ${activeTab === 'favourites' ? 'active' : ''}`}
                onClick={() => setActiveTab('favourites')}
              >
                <span className="tab-icon"><Heart size={18} /></span>
                <span className="tab-text">Favourites</span>
                <span className="tab-count">{trails.favourites.length}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                <span className="tab-icon"><CheckCircle size={18} /></span>
                <span className="tab-text">Completed</span>
                <span className="tab-count">{trails.completed.length}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`}
                onClick={() => setActiveTab('wishlist')}
              >
                <span className="tab-icon"><Bookmark size={18} /></span>
                <span className="tab-text">Wishlist</span>
                <span className="tab-count">{trails.wishlist.length}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'submitted' ? 'active' : ''}`}
                onClick={() => setActiveTab('submitted')}
              >
                <span className="tab-icon"><Upload size={18} /></span>
                <span className="tab-text">Submitted</span>
                <span className="tab-count">{trails.submitted.length}</span>
              </button>
            </div>
          </div>

          <div className="trails-content">
            <div className="active-tab-header">
              <h2>
                {activeTab === 'favourites' && (
                  <>
                    <Heart size={20} style={{ marginRight: '8px', display: 'inline-block' }} />
                    Favourite Trails
                  </>
                )}
                {activeTab === 'completed' && (
                  <>
                    <CheckCircle size={20} style={{ marginRight: '8px', display: 'inline-block' }} />
                    Completed Trails
                  </>
                )}
                {activeTab === 'wishlist' && (
                  <>
                    <Bookmark size={20} style={{ marginRight: '8px', display: 'inline-block' }} />
                    Wishlist Trails
                  </>
                )}
                {activeTab === 'submitted' && (
                  <>
                    <Upload size={20} style={{ marginRight: '8px', display: 'inline-block' }} />
                    Submitted Trails
                  </>
                )}
              </h2>
              <span className="trail-count">{trails[activeTab].length} trails</span>
            </div>
            
            <ul className="trails-list">
              {renderTrailList()}
            </ul>
          </div>
        </>
      )}

      <ReviewModal
        trailName={modalState.trailName}
        isOpen={modalState.isOpen}
        onClose={closeReviewModal}
        onSubmit={handleMarkAsCompleted}
      />

      <StatusConfirmModal
        isOpen={statusConfirmState.isOpen}
        onClose={closeStatusConfirmModal}
        onConfirm={handleStatusChange}
        trailName={statusConfirmState.trailName}
        currentStatus={statusConfirmState.currentStatus}
      />
    </div>
  );
}
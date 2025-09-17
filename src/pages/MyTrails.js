import React, { useEffect, useState } from 'react';
import { getAuth } from "firebase/auth";
import './MyTrails.css';

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
  const [trails, setTrails] = useState({ favourites: [], completed: [], wishlist: [] });
  const [alerts, setAlerts] = useState({});
  const [modalState, setModalState] = useState({
    isOpen: false,
    trailId: null,
    trailName: '',
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
        const res = await fetch(`https://getsavedtrails-fqtduxc7ua-uc.a.run.app?uid=${userId}`);
        const data = await res.json();
        setTrails(data);

        const allTrails = [...data.favourites, ...data.completed, ...data.wishlist];
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

  const handleRemove = async (trailId, listType) => {
    if (window.confirm("Are you sure you want to remove this trail?")) {
      try {
        let url = "";
        if (listType === "favourites") url = "https://us-central1-orion-sdp.cloudfunctions.net/removeFavourite";
        if (listType === "wishlist") url = "https://us-central1-orion-sdp.cloudfunctions.net/removeWishlist";
        if (listType === "completed") url = "https://us-central1-orion-sdp.cloudfunctions.net/removeCompleted";

        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: userId, trailId }),
        });

        setTrails((prev) => ({
          ...prev,
          [listType]: prev[listType].filter((t) => t.id !== trailId),
        }));
      } catch (err) {
        console.error("Failed to remove trail:", err);
        alert("Failed to remove trail. Please try again.");
      }
    }
  };

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
          <div className="empty-icon">🏔️</div>
          <p>No trails in your {activeTab} yet.</p>
          <p className="empty-subtext">Start exploring to add trails to your collection!</p>
        </div>
      );
    }
    
    return trailArray.map((trail) => (
      <li key={trail.id} className="trail-card">
        <div className="trail-header">
          <h4>{trail.name}</h4>
          <button
            className="remove-btn"
            onClick={() => handleRemove(trail.id, activeTab)}
            aria-label={`Remove ${trail.name}`}
          >
            ×
          </button>
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

        {/* Buttons */}
        <div className="trail-actions">
          {activeTab !== "completed" && (
            <button
              className="complete-btn"
              onClick={() => openReviewModal(trail.id, trail.name)}
            >
              Mark as Completed
            </button>
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
                <span className="tab-icon"></span>
                <span className="tab-text">Favourites</span>
                <span className="tab-count">{trails.favourites.length}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                <span className="tab-icon"></span>
                <span className="tab-text">Completed</span>
                <span className="tab-count">{trails.completed.length}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`}
                onClick={() => setActiveTab('wishlist')}
              >
                <span className="tab-icon"></span>
                <span className="tab-text">Wishlist</span>
                <span className="tab-count">{trails.wishlist.length}</span>
              </button>
            </div>
          </div>

          <div className="trails-content">
            <div className="active-tab-header">
              <h2>
                {activeTab === 'favourites' && ' Favourite Trails'}
                {activeTab === 'completed' && ' Completed Trails'}
                {activeTab === 'wishlist' && ' Wishlist Trails'}
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
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { getAuth } from "firebase/auth";

// Modal Component
const ReviewModal = ({ trailName, isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: isOpen ? "flex" : "none",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    animation: "fadeIn 0.3s ease-in",
  };

  const modalContentStyle = {
    background: "#0b132b",
    padding: "2rem",
    borderRadius: "12px",
    width: 400,
    maxWidth: "90%",
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    animation: "slideUp 0.3s ease-out",
    border: "1px solid #1e2a47",
  };

  const inputStyle = {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #2d3a5a",
    backgroundColor: "#0f1729",
    color: "#fff",
    fontSize: "1rem",
    marginBottom: "1rem",
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: "100px",
    resize: "vertical",
  };

  const buttonStyle = {
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "1rem",
    transition: "all 0.2s ease",
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#007bff",
    color: "#fff",
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#2d3a5a",
    color: "#ccc",
  };

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

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <h3 style={{ marginBottom: "1.5rem", color: "#fff" }}>Review: {trailName}</h3>
        
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#ccc" }}>
            Rating (1-5)
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={rating}
            onChange={(e) => setRating(parseInt(e.target.value) || 5)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#ccc" }}>
            Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            style={textareaStyle}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button style={cancelButtonStyle} onClick={handleClose}>
            Cancel
          </button>
          <button style={primaryButtonStyle} onClick={handleSubmit}>
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
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  useEffect(() => {
    async function fetchSavedTrails() {
      try {
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
      }
    }
    if (userId) fetchSavedTrails();
  }, [userId]);

const handleRemove = async (trailId, listType) => {
  try {
    let url = "";
    if (listType === "favourites") url = "https://us-central1-orion-sdp.cloudfunctions.net/removeFavourite";
    if (listType === "wishlist") url = "https://us-central1-orion-sdp.cloudfunctions.net/removeWishlist";
    if (listType === "completed") url = "https://us-central1-orion-sdp.cloudfunctions.net/removeCompleted"; // ✅ added

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
      const { trailId, trailName } = modalState;

      const newReview = {
        userId,
        rating,
        comment,
        timestamp: new Date().toISOString()
      };

      // Mark trail as completed
      await fetch("https://us-central1-orion-sdp.cloudfunctions.net/markCompleted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userId, trailId }),
      });

      // Update trail with new review
      await fetch("https://us-central1-orion-sdp.cloudfunctions.net/updateTrailInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trailId,
          updateData: { reviews: [newReview] }
        }),
      });

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

  // === UI ===
  const renderTrailList = (trailArray, listType) =>
    trailArray.map((trail) => (
      <li key={trail.id} style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#0f1729", borderRadius: "8px" }}>
        <strong style={{ color: "#fff" }}>{trail.name}</strong>

        {/* Alerts */}
        {alerts[trail.id] && alerts[trail.id].length > 0 && (
          <ul style={{ color: "#ff6b6b", marginTop: "0.5rem", paddingLeft: "1rem" }}>
            {alerts[trail.id].map((alert) => (
              <li key={alert.id} style={{ fontSize: "0.9rem" }}>
                <strong>[{alert.type}]</strong> {alert.message}
              </li>
            ))}
          </ul>
        )}

        {/* Buttons */}
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#dc3545",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
            onClick={() => handleRemove(trail.id, listType)}
          >
            Remove
          </button>
          {listType !== "completed" && (
            <button
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#28a745",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
              onClick={() => openReviewModal(trail.id, trail.name)}
            >
              Mark as Completed
            </button>
          )}
        </div>
      </li>
    ));

  return (
    <div className="container fade-in-up">
      <h1 style={{ color: "#fff", marginBottom: "2rem" }}>My Trails</h1>
      <div className="grid cols-3" style={{ gap: "1.5rem", marginTop: "1rem" }}>
        <div className="card" style={{ padding: "1.5rem", backgroundColor: "#1a243b", border: "1px solid #2d3a5a" }}>
          <h3 style={{ color: "#fff", marginBottom: "1rem" }}>Favourites</h3>
          <ul style={{ color: "#ccc", listStyle: "none", padding: 0 }}>
            {renderTrailList(trails.favourites, "favourites")}
          </ul>
        </div>
        <div className="card" style={{ padding: "1.5rem", backgroundColor: "#1a243b", border: "1px solid #2d3a5a" }}>
          <h3 style={{ color: "#fff", marginBottom: "1rem" }}>Completed</h3>
          <ul style={{ color: "#ccc", listStyle: "none", padding: 0 }}>
            {renderTrailList(trails.completed, "completed")}
          </ul>
        </div>
        <div className="card" style={{ padding: "1.5rem", backgroundColor: "#1a243b", border: "1px solid #2d3a5a" }}>
          <h3 style={{ color: "#fff", marginBottom: "1rem" }}>Wishlist</h3>
          <ul style={{ color: "#ccc", listStyle: "none", padding: 0 }}>
            {renderTrailList(trails.wishlist, "wishlist")}
          </ul>
        </div>
      </div>

      <ReviewModal
        trailName={modalState.trailName}
        isOpen={modalState.isOpen}
        onClose={closeReviewModal}
        onSubmit={handleMarkAsCompleted}
      />
    </div>
  );
}
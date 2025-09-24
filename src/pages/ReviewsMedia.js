import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../firebaseConfig"; // Import auth from firebaseConfig
import { onAuthStateChanged, signOut } from "firebase/auth"; // Import auth functions

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.19)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalContentStyle = {
  background: "#0b132b",
  padding: "2rem",
  borderRadius: "12px",
  width: 400,
  maxWidth: "90%",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};

const textareaStyle = {
  width: "100%",
  minHeight: 100,
  marginTop: "0.5rem",
  padding: "0.5rem",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: "1rem",
  resize: "vertical",
};

const inputFileStyle = { marginTop: "0.5rem" };

const buttonStyle = {
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  border: "none",
  cursor: "pointer",
  fontWeight: 500,
  backgroundColor: "#007bff",
  color: "#fff",
};

const primaryButtonStyle = { ...buttonStyle, backgroundColor: "#007bff", color: "#fff" };
const cancelButtonStyle = { ...buttonStyle, backgroundColor: "#f0f0f0", color: "#333" };

// Fetch trails API
async function fetchTrails() {
  const res = await fetch("https://us-central1-orion-sdp.cloudfunctions.net/getTrails");
  if (!res.ok) throw new Error("Failed to fetch trails");
  return res.json();
}

async function fetchTrailReviews(trailId) {
  const res = await fetch(
    `https://us-central1-orion-sdp.cloudfunctions.net/getTrailReviews?trailId=${trailId}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.reviews || [];
}

// Add this helper function outside the component
async function fetchTrailAlerts(trailId) {
  try {
    const res = await fetch(
      `https://gettrailalerts-fqtduxc7ua-uc.a.run.app/getAlerts?trailId=${trailId}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.alerts || [];
  } catch {
    return [];
  }
}

// Add this function to calculate average rating
function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  
  const sum = reviews.reduce((total, review) => total + (review.rating || 0), 0);
  return sum / reviews.length;
}

export default function ReviewsMedia() {
  const [trails, setTrails] = useState([]);
  const [reviews, setReviews] = useState({});
  const [alerts, setAlerts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredTrailId, setHoveredTrailId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedTrailId, setSelectedTrailId] = useState(null);

  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [newImages, setNewImages] = useState([]);
  const [alertType, setAlertType] = useState("general");
  const [alertMessage, setAlertMessage] = useState("");

  // Add user authentication state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load before fetching trails

    (async () => {
      try {
        const data = await fetchTrails();

        const trailsWithUrls = await Promise.all(
          data.map(async (trail) => {
            if (trail.photos && Array.isArray(trail.photos) && trail.photos.length > 0) {
              const urls = await Promise.all(
                trail.photos.map(async (path) => {
                  try {
                    if (path.startsWith("https://")) return path;
                    return await getDownloadURL(ref(storage, path));
                  } catch {
                    return null;
                  }
                })
              );
              return { ...trail, photos: urls.filter(Boolean) };
            }
            return { ...trail, photos: [] };
          })
        );

        // Fetch reviews for each trail and calculate average ratings
        const trailsWithRatings = await Promise.all(
          trailsWithUrls.map(async (trail) => {
            const trailReviews = await fetchTrailReviews(trail.id);
            const averageRating = calculateAverageRating(trailReviews);
            const reviewCount = trailReviews.length;
            
            return {
              ...trail,
              averageRating,
              reviewCount
            };
          })
        );

        setTrails(trailsWithRatings);

        const reviewsData = {};
        const alertsData = {};

        await Promise.all(
          trailsWithRatings.map(async (trail) => {
            reviewsData[trail.id] = await fetchTrailReviews(trail.id);
            alertsData[trail.id] = await fetchTrailAlerts(trail.id);
          })
        );

        setReviews(reviewsData);
        setAlerts(alertsData);
      } catch (err) {
        setError("Could not load trails or reviews");
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading]);

  const uploadPhotos = async (files) => {
    const urls = [];
    for (let file of files) {
      const fileRef = ref(storage, `trails/${uuidv4()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      urls.push(url);
    }
    return urls;
  };

  const openModal = (trailId, type) => {
    // Check if user is logged in for review submission
    if (type === "review" && !user) {
      alert("Please log in to submit a review");
      return;
    }
    
    setSelectedTrailId(trailId);
    setModalType(type);
    setNewReview("");
    setNewRating(0);
    setNewImages([]);
    setAlertType("general");
    setAlertMessage("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedTrailId(null);
    setModalType(null);
  };

  const handleAddAlert = async () => {
    if (!alertMessage) return;

    try {
      const response = await fetch(
        "https://us-central1-orion-sdp.cloudfunctions.net/addAlert",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trailId: selectedTrailId,
            message: alertMessage,
            type: alertType
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Server returned ${response.status}`);

      const alertsResponse = await fetch(
        `https://us-central1-orion-sdp.cloudfunctions.net/getAlerts?trailId=${selectedTrailId}`
      );
      const alertsData = await alertsResponse.json();

      if (alertsResponse.ok) {
        setAlerts((prev) => ({
          ...prev,
          [selectedTrailId]: alertsData.alerts || []
        }));
      }

      closeModal();
      alert("✅ Alert added successfully!");
    } catch (err) {
      console.error("Error adding alert:", err);
      alert("❌ Failed to add alert: " + err.message);
    }
  };

  const handleAddReview = async () => {
    if (!newReview) return;

    try {
      // Use actual user data instead of "anonymous"
      const userDisplayName = user.displayName || user.email || "User";
      
      const response = await fetch(
        "https://us-central1-orion-sdp.cloudfunctions.net/addTrailReview",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trailId: selectedTrailId,
            review: {
              id: uuidv4(),
              message: newReview,
              rating: newRating,
              timestamp: new Date().toISOString(),
              userId: user.uid, // Use actual user ID
              userName: userDisplayName, // Use actual user name
              userEmail: user.email // Optional: store email for reference
            }
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Server returned ${response.status}`);

      // Refetch reviews to update the average rating
      const updatedReviews = await fetchTrailReviews(selectedTrailId);
      setReviews((prev) => ({
        ...prev,
        [selectedTrailId]: updatedReviews,
      }));

      // Update the trail's average rating
      const averageRating = calculateAverageRating(updatedReviews);
      setTrails(prev => prev.map(trail => 
        trail.id === selectedTrailId 
          ? {...trail, averageRating, reviewCount: updatedReviews.length}
          : trail
      ));

      closeModal();
      alert("✅ Review added successfully!");
    } catch (err) {
      console.error("Error adding review:", err);
      alert("❌ Failed to add review: " + err.message);
    }
  };

  const handleAddImages = async () => {
    if (!newImages || newImages.length === 0) return;

    try {
      const uploadedUrls = await uploadPhotos(newImages);

      const response = await fetch(
        "https://us-central1-orion-sdp.cloudfunctions.net/updateTrailImages",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trailId: selectedTrailId,
            photos: uploadedUrls
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Server returned ${response.status}`);

      const updatedTrails = await fetchTrails();
      const trailsWithUrls = await Promise.all(
        updatedTrails.map(async (trail) => {
          if (trail.photos && Array.isArray(trail.photos) && trail.photos.length > 0) {
            const urls = await Promise.all(
              trail.photos.map(async (path) => {
                try {
                  if (path.startsWith("https://")) return path;
                  return await getDownloadURL(ref(storage, path));
                } catch {
                  return null;
                }
              })
            );
            return { ...trail, photos: urls.filter(Boolean) };
          }
          return { ...trail, photos: [] };
        })
      );

      setTrails(trailsWithUrls);
      closeModal();
      alert("✅ Images added successfully!");
    } catch (err) {
      console.error("Error adding images:", err);
      alert("❌ Failed to add images: " + err.message);
    }
  };

  if (authLoading || loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="container fade-in-up">
      {/* Add user info and logout button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1>Trails</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {user ? (
            <>
              <span>Welcome, {user.displayName || user.email}!</span>
              <button style={cancelButtonStyle} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <span>Please log in to submit reviews</span>
          )}
        </div>
      </div>
      
      <div className="grid cols-3" style={{ marginTop: "1rem" }}>
        {trails.map((trail) => (
          <div
            className="card"
            key={trail.id}
            style={{ padding: "1rem", position: "relative" }}
            onMouseEnter={() => setHoveredTrailId(trail.id)}
            onMouseLeave={() => setHoveredTrailId(null)}
          >
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}
            >
              {trail.photos.length > 0 ? (
                trail.photos.map((photoUrl, index) => (
                  <img
                    key={index}
                    src={photoUrl}
                    alt={`Trail ${trail.name} ${index + 1}`}
                    style={{
                      height: 100,
                      borderRadius: 6,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ))
              ) : (
                <div
                  style={{
                    height: 100,
                    width: "100%",
                    backgroundColor: "#eee",
                    borderRadius: 6,
                  }}
                >
                  No images
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h4 style={{ margin: 0 }}>{trail.name}</h4>
              <span style={{ fontSize: "0.9rem", color: "#666" }}>
                ⭐ {trail.averageRating ? trail.averageRating.toFixed(1) : "N/A"} 
                {trail.reviewCount > 0 && ` (${trail.reviewCount})`}
              </span>
              {hoveredTrailId === trail.id && (
                <div style={{ display: "flex", gap: "0.25rem" }}>
                  <button 
                    style={{...buttonStyle, opacity: user ? 1 : 0.6}} 
                    onClick={() => openModal(trail.id, "review")}
                    title={user ? "Add Review" : "Please log in to review"}
                  >
                    Add Review
                  </button>
                  <button style={buttonStyle} onClick={() => openModal(trail.id, "images")}>
                    Add Images
                  </button>
                  <button style={buttonStyle} onClick={() => openModal(trail.id, "alert")}>
                    Add Alert
                  </button>
                </div>
              )}
            </div>

            {alerts[trail.id] && alerts[trail.id].length > 0 && (
              <ul style={{ color: "red", marginTop: "0.25rem" }}>
                {alerts[trail.id].map((a) => (
                  <li key={a.id}>
                    [{a.type}] {a.message}
                  </li>
                ))}
              </ul>
            )}

            <div
              style={{
                marginTop: "0.5rem",
                maxHeight: "150px",
                overflowY: "auto",
                paddingRight: "0.5rem",
              }}
            >
              {reviews[trail.id] && reviews[trail.id].length > 0 ? (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {reviews[trail.id].map((rev) => (
                    <li
                      key={rev.id}
                      style={{
                        marginBottom: "1rem",
                        paddingBottom: "0.5rem",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {rev.rating && (
                        <div style={{ marginBottom: "0.25rem" }}>
                          {"★".repeat(rev.rating)}
                          {"☆".repeat(5 - rev.rating)}
                        </div>
                      )}

                      <div>
                        <strong style={{ marginRight: "0.5rem" }}>
                          {rev.userName || "Anonymous"}
                        </strong>
                        <span style={{ color: "var(--muted)" }}>{rev.message}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No reviews yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            {modalType === "alert" && (
              <>
                <h3>Add Alert</h3>
                <label>Type:</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  style={{ width: "100%", marginBottom: "0.5rem" }}
                >
                  <option value="general">General</option>
                  <option value="closure">Closure</option>
                  <option value="warning">Warning</option>
                  <option value="condition">Condition</option>
                </select>
                <textarea
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Enter alert message..."
                  style={textareaStyle}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", gap: "0.5rem" }}>
                  <button style={cancelButtonStyle} onClick={closeModal}>
                    Cancel
                  </button>
                  <button style={primaryButtonStyle} onClick={handleAddAlert}>
                    Submit
                  </button>
                </div>
              </>
            )}
            
            {modalType === "review" && (
              <>
                <h3>Add Review {user && `(as ${user.displayName || user.email})`}</h3>
                <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.5rem" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      style={{
                        cursor: "pointer",
                        color: newRating >= star ? "gold" : "#ccc",
                        fontSize: "1.5rem",
                      }}
                      onClick={() => setNewRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Write your review..."
                  style={textareaStyle}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", gap: "0.5rem" }}>
                  <button style={cancelButtonStyle} onClick={closeModal}>
                    Cancel
                  </button>
                  <button style={primaryButtonStyle} onClick={handleAddReview}>
                    Submit
                  </button>
                </div>
              </>
            )}
            
            {modalType === "images" && (
              <>
                <h3>Add Images</h3>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setNewImages(Array.from(e.target.files))}
                  style={inputFileStyle}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", gap: "0.5rem" }}>
                  <button style={cancelButtonStyle} onClick={closeModal}>
                    Cancel
                  </button>
                  <button style={primaryButtonStyle} onClick={handleAddImages}>
                    Upload
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
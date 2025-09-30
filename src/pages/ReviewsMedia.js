import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Shield, AlertCircle, Star, MessageSquare } from "lucide-react";

// Import components
import AlertsPopup from "../components/AlertsPopup";
import ReviewsTrailCard from "../components/ReviewsTrailCard";
import ReviewsTrailSkeleton from "../components/ReviewsTrailSkeleton";
import SuccessPopup from "../components/SuccessPopup";
import "./ReviewsMedia.css";

// =========================
// 🎨 Responsive Styles
// =========================
const responsiveStyles = {
  container: {
    padding: "1.5rem",
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "'Inter', sans-serif",
    color: "#f5f5f5",
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.5rem",
    marginTop: "2rem",
  },
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 70,
    padding: "1rem",
  },
  modalContent: {
    background: "#1c2540",
    padding: "2rem",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
    transform: "scale(0.95)",
    animation: "fadeIn 0.25s ease forwards",
  },
  textarea: {
    width: "100%",
    minHeight: "100px",
    marginTop: "0.5rem",
    padding: "0.75rem",
    borderRadius: "8px",
    border: "1px solid #444",
    background: "#0b132b",
    color: "#f5f5f5",
    fontSize: "1rem",
    resize: "vertical",
  },
  modalButtons: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "1rem",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "0.6rem 1.2rem",
    borderRadius: "20px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    backgroundColor: "#00b894",
    color: "#fff",
    transition: "background 0.2s ease",
  },
  cancelButton: {
    padding: "0.6rem 1.2rem",
    borderRadius: "20px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    backgroundColor: "#636e72",
    color: "#fff",
  },
};

// Helper for inline style
const getResponsiveStyle = (styleKey) => responsiveStyles[styleKey] || {};

// =========================
// 📡 API Helpers
// =========================
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

// =========================
// 🌲 Main Component
// =========================
export default function ReviewsMedia() {
  const [trails, setTrails] = useState([]);
  const [reviews, setReviews] = useState({});
  const [alerts, setAlerts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredTrailId, setHoveredTrailId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [alertsPopup, setAlertsPopup] = useState({
    isVisible: false,
    position: { x: 0, y: 0 },
    alerts: []
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedTrailId, setSelectedTrailId] = useState(null);

  const [newReview, setNewReview] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [newImages, setNewImages] = useState([]);
  const [alertType, setAlertType] = useState("general");
  const [alertMessage, setAlertMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Success popup state
  const [successPopup, setSuccessPopup] = useState({
    isVisible: false,
    message: ""
  });

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

  const handleShowAlertsPopup = (event, trailAlerts) => {
    if (!trailAlerts || trailAlerts.length === 0) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    setAlertsPopup({
      isVisible: true,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8
      },
      alerts: trailAlerts
    });
  };

  const handleHideAlertsPopup = () => {
    setAlertsPopup({
      isVisible: false,
      position: { x: 0, y: 0 },
      alerts: []
    });
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load before fetching trails
    (async () => {
      try {
        const data = await fetchTrails();
        
        // Process trails progressively - show them as they load
        setTrails(data.map(trail => ({ 
          ...trail, 
          photos: [], 
          averageRating: 0, 
          reviewCount: 0,
          processedPhotos: false,
          hasReviews: false,
          hasAlerts: false
        })));
        setLoading(false);

        // Process photos, reviews, and alerts in parallel for each trail
        const reviewsData = {};
        const alertsData = {};
        
        // Process trails in batches to avoid overwhelming the browser
        const batchSize = 5;
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          
          const batchResults = await Promise.all(
            batch.map(async (trail) => {
              try {
                // Process photos with timeout
                let photos = [];
                let processedPhotos = true;
                if (trail.photos?.length > 0) {
                  try {
                    const photoPromises = trail.photos.map(async (path) => {
                      try {
                        if (path.startsWith("https://")) return path;
                        return await getDownloadURL(ref(storage, path));
                      } catch {
                        return null;
                      }
                    });
                    
                    // Add timeout for photo processing
                    const timeoutPromise = new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Photo processing timeout')), 10000)
                    );
                    
                    const urls = await Promise.race([
                      Promise.all(photoPromises),
                      timeoutPromise
                    ]);
                    photos = urls.filter(Boolean);
                  } catch (error) {
                    console.warn(`Failed to process photos for trail ${trail.id}:`, error);
                    photos = [];
                    processedPhotos = false;
                  }
                }

                // Fetch reviews and calculate ratings with timeout
                let trailReviews = [];
                let hasReviews = false;
                try {
                  const reviewPromise = fetchTrailReviews(trail.id);
                  const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Review fetch timeout')), 8000)
                  );
                  
                  trailReviews = await Promise.race([reviewPromise, timeoutPromise]);
                  hasReviews = true;
                } catch (error) {
                  console.warn(`Failed to fetch reviews for trail ${trail.id}:`, error);
                  trailReviews = [];
                }
                
                const averageRating = calculateAverageRating(trailReviews);
                const reviewCount = trailReviews.length;
                
                // Fetch alerts with timeout
                let trailAlerts = [];
                let hasAlerts = false;
                try {
                  const alertPromise = fetchTrailAlerts(trail.id);
                  const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Alert fetch timeout')), 5000)
                  );
                  
                  trailAlerts = await Promise.race([alertPromise, timeoutPromise]);
                  hasAlerts = true;
                } catch (error) {
                  console.warn(`Failed to fetch alerts for trail ${trail.id}:`, error);
                  trailAlerts = [];
                }
                
                // Store data
                reviewsData[trail.id] = trailReviews;
                alertsData[trail.id] = trailAlerts;
                
                return {
                  ...trail,
                  photos,
                  averageRating,
                  reviewCount,
                  processedPhotos,
                  hasReviews,
                  hasAlerts
                };
              } catch (error) {
                console.error(`Failed to process trail ${trail.id}:`, error);
                // Return trail with minimal data to prevent infinite loading
                return {
                  ...trail,
                  photos: [],
                  averageRating: 0,
                  reviewCount: 0,
                  processedPhotos: true, // Mark as processed to stop loading
                  hasReviews: false,
                  hasAlerts: false
                };
              }
            })
          );

          // Update trails progressively
          setTrails(prevTrails => 
            prevTrails.map(trail => {
              const updatedTrail = batchResults.find(t => t.id === trail.id);
              return updatedTrail || trail;
            })
          );
        }

        setReviews(reviewsData);
        setAlerts(alertsData);
      } catch (err) {
        setError("Could not load trails or reviews");
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
    setNewReview("");
    setNewRating(0);
    setIsAnonymous(false);
  };

  const closeSuccessPopup = () => {
    setSuccessPopup({
      isVisible: false,
      message: ""
    });
  };

  const handleAddReview = async () => {
    if (!newReview) return;
    try {
      // Use actual user data or anonymous based on user choice
      const userDisplayName = isAnonymous ? "Anonymous" : (user.displayName || user.email || "User");
      
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
      setSuccessPopup({
        isVisible: true,
        message: "Your review has been submitted successfully!"
      });
    } catch (err) {
      alert("Failed to add review: " + err.message);
    }
  };

  const handleAddAlert = async () => {
    if (!alertMessage) return;
    try {
      await fetch("https://us-central1-orion-sdp.cloudfunctions.net/addAlert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trailId: selectedTrailId,
          message: alertMessage,
          type: alertType,
        }),
      });
      const alertsData = await fetchTrailAlerts(selectedTrailId);
      setAlerts((prev) => ({ ...prev, [selectedTrailId]: alertsData }));
      closeModal();
      setSuccessPopup({
        isVisible: true,
        message: "Your alert has been submitted successfully!"
      });
    } catch (err) {
      alert("Failed to add alert: " + err.message);
    }
  };

  const handleAddImages = async () => {
    if (!newImages.length) return;
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
      setTrails(updatedTrails);
      closeModal();
      setSuccessPopup({
        isVisible: true,
        message: "Your images have been uploaded successfully!"
      });
    } catch (err) {
      alert("Failed to add images: " + err.message);
    }
  };

  if (authLoading) return (
    <div style={getResponsiveStyle("container")}>
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "1.2rem", color: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <Shield size={18} />
          Authenticating...
        </div>
      </div>
    </div>
  );
  
  if (error) return (
    <div style={getResponsiveStyle("container")}>
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ color: "#ff6b6b", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
          <AlertCircle size={18} />
          {error}
        </div>
        <button 
          style={{...getResponsiveStyle("primaryButton"), marginTop: "1rem"}} 
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div style={getResponsiveStyle("container")}>
      <h1 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <MessageSquare size={20} />
        Trail Reviews & Media
      </h1>
      
      <div style={getResponsiveStyle("gridContainer")}>
        {Array.isArray(trails) ? trails.map((trail) => {
          // Show skeleton if trail is still loading (check if it has been processed)
          // A trail is considered loaded if it has been processed (has processedPhotos flag or has data)
          const isLoading = !trail.processedPhotos && !trail.hasReviews && !trail.hasAlerts;
          
          if (isLoading) {
            return <ReviewsTrailSkeleton key={trail.id} />;
          }
          
          return (
            <ReviewsTrailCard
              key={trail.id}
              trail={trail}
              alerts={alerts}
              reviews={reviews}
              user={user}
              loadedImages={loadedImages}
              setLoadedImages={setLoadedImages}
              onShowAlertsPopup={handleShowAlertsPopup}
              onHideAlertsPopup={handleHideAlertsPopup}
              onOpenModal={openModal}
            />
          );
        }) : (
          <div style={{ textAlign: "center", padding: "2rem", color: "#f5f5f5" }}>
            <div>Loading trails...</div>
          </div>
        )}
      </div>

      {/* Alerts Popup */}
      <AlertsPopup
        isVisible={alertsPopup.isVisible}
        position={alertsPopup.position}
        alerts={alertsPopup.alerts}
        onMouseLeave={handleHideAlertsPopup}
      />

      {/* Success Popup */}
      <SuccessPopup
        isVisible={successPopup.isVisible}
        message={successPopup.message}
        onClose={closeSuccessPopup}
      />

      {modalOpen && (
        <div style={getResponsiveStyle("modalOverlay")} onClick={closeModal}>
          <div style={getResponsiveStyle("modalContent")} onClick={(e) => e.stopPropagation()}>
            {modalType === "alert" && (
              <>
                <h3>Add Alert</h3>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem", borderRadius: "6px" }}
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
                  style={getResponsiveStyle("textarea")}
                />
                <div style={getResponsiveStyle("modalButtons")}>
                  <button style={getResponsiveStyle("cancelButton")} onClick={closeModal}>Cancel</button>
                  <button style={getResponsiveStyle("primaryButton")} onClick={handleAddAlert}>Submit</button>
                </div>
              </>
            )}

            {modalType === "review" && (
              <>
                <h3>Add Review {user && !isAnonymous && `(as ${user.displayName || user.email})`}</h3>
                <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.5rem" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      style={{
                        cursor: "pointer",
                        color: newRating >= star ? "gold" : "#ccc",
                        display: "flex",
                        alignItems: "center",
                      }}
                      onClick={() => setNewRating(star)}
                    >
                      <Star 
                        size={20} 
                        fill={newRating >= star ? "currentColor" : "none"} 
                        color={newRating >= star ? "gold" : "#ccc"}
                      />
                    </span>
                  ))}
                </div>

                <textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Write your review..."
                  style={getResponsiveStyle("textarea")}
                />
                
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "0.5rem", 
                  marginTop: "1rem",
                  marginBottom: "1rem"
                }}>
                  <input
                    type="checkbox"
                    id="anonymous-review"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "var(--accent)"
                    }}
                  />
                  <label 
                    htmlFor="anonymous-review"
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                      cursor: "pointer"
                    }}
                  >
                    Submit as anonymous
                  </label>
                </div>
                
                <div style={getResponsiveStyle("modalButtons")}>
                  <button style={getResponsiveStyle("cancelButton")} onClick={closeModal}>Cancel</button>
                  <button style={getResponsiveStyle("primaryButton")} onClick={handleAddReview}>Submit</button>
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
                  style={{ marginTop: "0.5rem", width: "100%" }}
                />
                <div style={getResponsiveStyle("modalButtons")}>
                  <button style={getResponsiveStyle("cancelButton")} onClick={closeModal}>Cancel</button>
                  <button style={getResponsiveStyle("primaryButton")} onClick={handleAddImages}>Upload</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

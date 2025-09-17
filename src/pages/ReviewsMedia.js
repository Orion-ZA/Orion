import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";

// =========================
// 🎨 Modern Styles
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
  card: {
    padding: "1rem",
    borderRadius: "12px",
    background: "linear-gradient(145deg, #1c2540, #2a355d)",
    boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  imageContainer: {
    display: "flex",
    overflowX: "auto",
    gap: "0.5rem",
    marginBottom: "0.5rem",
    scrollbarWidth: "thin",
    msOverflowStyle: "none",
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: "220px",
    flexShrink: 0,
    borderRadius: "10px",
    overflow: "hidden",
    backgroundColor: "#111",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  },
  imageStyle: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  trailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "1rem",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    paddingBottom: "0.5rem",
  },
  buttonContainer: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  button: {
    padding: "0.6rem 1.2rem",
    borderRadius: "20px",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    backgroundColor: "#2d79f3",
    color: "#fff",
    fontSize: "0.9rem",
    transition: "background 0.2s ease",
  },
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedTrailId, setSelectedTrailId] = useState(null);

  const [newReview, setNewReview] = useState("");
  const [newImages, setNewImages] = useState([]);
  const [alertType, setAlertType] = useState("general");
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchTrails();
        const trailsWithUrls = await Promise.all(
          data.map(async (trail) => {
            if (trail.photos?.length > 0) {
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

        const reviewsData = {};
        const alertsData = {};
        await Promise.all(
          trailsWithUrls.map(async (trail) => {
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
  }, []);

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
    setSelectedTrailId(trailId);
    setModalType(type);
    setNewReview("");
    setNewImages([]);
    setAlertType("general");
    setAlertMessage("");
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleAddReview = async () => {
    if (!newReview) return;
    try {
      await fetch("https://us-central1-orion-sdp.cloudfunctions.net/addTrailReview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trailId: selectedTrailId,
          review: {
            id: uuidv4(),
            message: newReview,
            timestamp: new Date().toISOString(),
            userId: "anonymous",
            userName: "Anonymous User",
          },
        }),
      });
      const updatedReviews = await fetchTrailReviews(selectedTrailId);
      setReviews((prev) => ({ ...prev, [selectedTrailId]: updatedReviews }));
      closeModal();
      alert("✅ Review added successfully!");
    } catch (err) {
      alert("❌ Failed to add review: " + err.message);
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
      alert("✅ Alert added successfully!");
    } catch (err) {
      alert("❌ Failed to add alert: " + err.message);
    }
  };

  const handleAddImages = async () => {
    if (!newImages.length) return;
    try {
      const uploadedUrls = await uploadPhotos(newImages);
      await fetch("https://us-central1-orion-sdp.cloudfunctions.net/updateTrailImages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trailId: selectedTrailId, photos: uploadedUrls }),
      });
      const updatedTrails = await fetchTrails();
      setTrails(updatedTrails);
      closeModal();
      alert("✅ Images added successfully!");
    } catch (err) {
      alert("❌ Failed to add images: " + err.message);
    }
  };

  if (loading) return <p>Loading trails...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={getResponsiveStyle("container")}>
      <h1>🌲 Hiking Trails</h1>
      <div style={getResponsiveStyle("gridContainer")}>
        {trails.map((trail) => (
          <div
            key={trail.id}
            style={getResponsiveStyle("card")}
            onMouseEnter={() => !isMobile && setHoveredTrailId(trail.id)}
            onMouseLeave={() => !isMobile && setHoveredTrailId(null)}
            className="card"
          >
            <div style={getResponsiveStyle("imageContainer")}>
              {trail.photos.length > 0 ? (
                trail.photos.map((photoUrl, index) => (
                  <div key={index} style={getResponsiveStyle("imageWrapper")}>
                    <img
                      src={photoUrl}
                      alt={`Trail ${trail.name} ${index + 1}`}
                      style={getResponsiveStyle("imageStyle")}
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </div>
                ))
              ) : (
                <div style={getResponsiveStyle("imageWrapper")}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                      height: "100%",
                      color: "#999",
                      fontSize: "0.8rem",
                    }}
                  >
                    No images
                  </div>
                </div>
              )}
            </div>

            <div style={getResponsiveStyle("trailHeader")}>
              <h4 style={{ margin: 0 }}>{trail.name}</h4>
              {(hoveredTrailId === trail.id || isMobile) && (
                <div style={getResponsiveStyle("buttonContainer")}>
                  <button style={getResponsiveStyle("button")} onClick={() => openModal(trail.id, "review")}>
                    Review
                  </button>
                  <button style={getResponsiveStyle("button")} onClick={() => openModal(trail.id, "images")}>
                    Images
                  </button>
                  <button style={getResponsiveStyle("button")} onClick={() => openModal(trail.id, "alert")}>
                    Alert
                  </button>
                </div>
              )}
            </div>

            {alerts[trail.id]?.length > 0 && (
              <ul style={{ color: "red", marginTop: "0.5rem", fontSize: "0.9rem" }}>
                {alerts[trail.id].map((a) => (
                  <li key={a.id}>
                    [{a.type}] {a.message}
                  </li>
                ))}
              </ul>
            )}

            <div style={{ marginTop: "0.5rem" }}>
              {reviews[trail.id] && reviews[trail.id].length > 0 ? (
                <ul style={{ color: "var(--muted)", paddingLeft: "1rem" }}>
                  {reviews[trail.id].map((rev) => (
                    <li key={rev.id}>{rev.comment || rev.message}</li>
                  ))}
                  {reviews[trail.id].length > 3 && (
                    <li>...and {reviews[trail.id].length - 3} more</li>
                  )}
                </ul>
              ) : (
                <p style={{ color: "#777", margin: 0 }}>No reviews yet.</p>
              )}
            </div>
          </div>
        ))}
      </div>

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
                <h3>Add Review</h3>
                <textarea
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Write your review..."
                  style={getResponsiveStyle("textarea")}
                />
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

      {/* Hover + animation styles */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .card:hover {
            transform: translateY(-6px);
            box-shadow: 0 12px 30px rgba(0,0,0,0.25);
          }
          button:hover {
            background-color: #019874 ;
          }
          @media (max-width: 768px) {
            h1 { font-size: 1.8rem; }
            h4 { font-size: 1rem; }
          }
        `}
      </style>
    </div>
  );
}

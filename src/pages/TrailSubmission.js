import React, { useState, useEffect } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import mbxClient from "@mapbox/mapbox-sdk/services/geocoding";
import { collection, addDoc, GeoPoint, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebaseConfig";
import { v4 as uuidv4 } from "uuid";

const geocodingClient = mbxClient({ accessToken: process.env.REACT_APP_MAPBOX_TOKEN });

export default function TrailSubmission() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [viewport, setViewport] = useState({
    latitude: -26.2041,
    longitude: 28.0473,
    zoom: 10,
  });
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: -26.2041,
    longitude: 28.0473,
    name: "Johannesburg",
  });
  const [placeInput, setPlaceInput] = useState(selectedLocation.name);
  const [routePoints, setRoutePoints] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    distance: "",
    elevationGain: "",
    difficulty: "Easy",
    status: "open",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  // --- Get current user ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Handlers ---
  const handlePlaceInputChange = (e) => setPlaceInput(e.target.value);

  const handlePlaceInputBlur = async () => {
    if (!placeInput) return;
    try {
      const response = await geocodingClient
        .forwardGeocode({ query: placeInput, limit: 1 })
        .send();
      const match = response.body.features[0];
      if (match) {
        const [lng, lat] = match.center;
        setSelectedLocation({ latitude: lat, longitude: lng, name: match.place_name });
        setViewport((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  const handleMapClick = (evt) => {
    const { lngLat } = evt;
    setSelectedLocation({ latitude: lngLat.lat, longitude: lngLat.lng, name: "" });
    setPlaceInput("");
    setRoutePoints([...routePoints, [lngLat.lng, lngLat.lat]]);
  };

  const handleFileChange = (e) => setSelectedFiles(Array.from(e.target.files));

  const handleFormChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleTagInputChange = (e) => setTagInput(e.target.value);

  const handleAddTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim().toLowerCase())) {
      setForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()]
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

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

  const handleSubmit = async () => {
    if (!currentUserId) {
      alert("You must be logged in to submit a trail.");
      return;
    }

    if (!form.name || !selectedLocation) {
      alert("Please enter a trail name and select a location.");
      return;
    }

    try {
      const photoUrls = await uploadPhotos(selectedFiles);

      // Create trail document following the exact schema
      const trailData = {
        name: form.name,
        location: new GeoPoint(selectedLocation.latitude, selectedLocation.longitude),
        distance: Number(form.distance),
        elevationGain: Number(form.elevationGain),
        difficulty: form.difficulty,
        tags: form.tags,
        gpsRoute: routePoints.map(([lng, lat]) => new GeoPoint(lat, lng)),
        description: form.description,
        photos: photoUrls,
        status: {
          status: form.status,
          lastUpdated: new Date()
        },
        createdBy: doc(db, "users", currentUserId), // Reference to User document
      };

      await addDoc(collection(db, "Trails"), trailData);

      alert("Trail submitted successfully!");
      
      // Reset form
      setForm({ 
        name: "", 
        description: "", 
        distance: "", 
        elevationGain: "",
        difficulty: "Easy", 
        status: "open",
        tags: []
      });
      setSelectedFiles([]);
      setRoutePoints([]);
      setPlaceInput("");
      setTagInput("");
      setSelectedLocation({ latitude: -26.2041, longitude: 28.0473, name: "Johannesburg" });
      setViewport({ latitude: -26.2041, longitude: 28.0473, zoom: 10 });
    } catch (err) {
      console.error("Error submitting trail:", err);
      alert("Failed to submit trail.");
    }
  };

  if (!currentUserId) {
    return <p>Please log in to submit a trail.</p>;
  }

  return (
    <div className="container fade-in-up">
      <h1>Trail Submission</h1>
      <div className="card" style={{ padding: "1rem", marginTop: "1rem" }}>
        <p className="muted">Create or update a hiking trail.</p>

        <div className="grid cols-2" style={{ marginTop: ".5rem" }}>
          {/* Map */}
          <div style={{ height: "100vh", width: "100%" }}>
            <Map
              {...viewport}
              mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
              mapStyle="mapbox://styles/mapbox/standard"
              onMove={(evt) => setViewport(evt.viewState)}
              onClick={handleMapClick}
            >
              {selectedLocation && (
                <Marker
                  latitude={selectedLocation.latitude}
                  longitude={selectedLocation.longitude}
                  color="red"
                  draggable
                  onDragEnd={(evt) =>
                    setSelectedLocation({ latitude: evt.lngLat.lat, longitude: evt.lngLat.lng, name: "" })
                  }
                />
              )}

              {selectedLocation && (
                <Popup
                  latitude={selectedLocation.latitude}
                  longitude={selectedLocation.longitude}
                  onClose={() => setSelectedLocation(null)}
                  closeOnClick={true}
                  anchor="top"
                >
                  <div>{selectedLocation.name || "Selected Location"}</div>
                </Popup>
              )}

              {routePoints.length > 1 && (
                <Source
                  id="route"
                  type="geojson"
                  data={{
                    type: "Feature",
                    geometry: { type: "LineString", coordinates: routePoints },
                  }}
                >
                  <Layer
                    id="route-layer"
                    type="line"
                    paint={{ "line-color": "#ff0000", "line-width": 4 }}
                  />
                </Source>
              )}
            </Map>
          </div>

          {/* Form */}
          <div>
            <label>Name *</label>
            <input
              className="input"
              placeholder="Trail name"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              required
            />

            <label>Location *</label>
            <input
              className="input"
              placeholder="Enter place name"
              value={placeInput}
              onChange={handlePlaceInputChange}
              onBlur={handlePlaceInputBlur}
              onKeyDown={(e) => e.key === "Enter" && handlePlaceInputBlur()}
              required
            />

            <label>Distance (km) *</label>
            <input
              className="input"
              type="number"
              step="0.1"
              placeholder="Distance in kilometers"
              name="distance"
              value={form.distance}
              onChange={handleFormChange}
              required
            />

            <label>Elevation Gain (m) *</label>
            <input
              className="input"
              type="number"
              placeholder="Elevation gain in meters"
              name="elevationGain"
              value={form.elevationGain}
              onChange={handleFormChange}
              required
            />

            <label>Difficulty *</label>
            <select className="input" name="difficulty" value={form.difficulty} onChange={handleFormChange}>
              <option value="Easy">Easy</option>
              <option value="Moderate">Moderate</option>
              <option value="Hard">Hard</option>
            </select>

            <label>Status *</label>
            <select className="input" name="status" value={form.status} onChange={handleFormChange}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>

            <label>Tags</label>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                className="input"
                placeholder="Add tags (e.g., waterfall, forest)"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                className="button" 
                onClick={handleAddTag}
                style={{ padding: "0.5rem 1rem" }}
              >
                Add
              </button>
            </div>
            
            {form.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                {form.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    style={{ 
                      background: "#007bff", 
                      color: "white", 
                      padding: "0.25rem 0.5rem", 
                      borderRadius: "0.25rem",
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem"
                    }}
                  >
                    {tag}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTag(tag)}
                      style={{ 
                        background: "none", 
                        border: "none", 
                        color: "white", 
                        cursor: "pointer",
                        fontSize: "1rem",
                        padding: "0"
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <label>Description *</label>
            <textarea
              className="input"
              rows="4"
              placeholder="Trail highlights, terrain, best season, safety notes..."
              name="description"
              value={form.description}
              onChange={handleFormChange}
              required
            />

            <label>Photos</label>
            <input 
              type="file" 
              multiple 
              accept="image/*"
              onChange={handleFileChange} 
            />
            {selectedFiles.length > 0 && (
              <p style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.25rem" }}>
                {selectedFiles.length} file(s) selected
              </p>
            )}

            <button className="button" style={{ marginTop: "1rem" }} onClick={handleSubmit}>
              Submit Trail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
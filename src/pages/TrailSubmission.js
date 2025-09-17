import React, { useState, useEffect, useRef } from "react";
// Use standard react-map-gl entry ("/mapbox" path can cause instability with version mismatch)
// Import from explicit subpath; root export "." not provided in v8 exports
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/mapbox';
import "mapbox-gl/dist/mapbox-gl.css";
import mbxClient from "@mapbox/mapbox-sdk/services/geocoding";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../firebaseConfig";
import { v4 as uuidv4 } from "uuid";

// Mapbox Geocoding client
// Will be null if the env var isn't set so we can degrade gracefully instead of throwing
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
let geocodingClient = null;
try {
  if (MAPBOX_TOKEN) {
    geocodingClient = mbxClient({ accessToken: MAPBOX_TOKEN });
  } else {
    // eslint-disable-next-line no-console
    console.warn("REACT_APP_MAPBOX_TOKEN is not defined. Mapbox geocoding disabled.");
  }
} catch (e) {
  // eslint-disable-next-line no-console
  console.error("Failed to initialise Mapbox geocoding client:", e);
}

// API Configuration
// Note: Firebase Functions URLs are public by design and safe to expose in frontend code.
// Security is handled by Firebase Auth tokens, not by hiding URLs.
const API_BASE_URL = 'https://us-central1-orion-sdp.cloudfunctions.net';

export default function TrailSubmission() {
  const mapRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
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

  // --- Location handlers ---
  const getUserLocation = () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setUserLocation({ longitude, latitude });
        setViewport(prev => ({ ...prev, longitude, latitude, zoom: 13 }));
        setIsLoadingLocation(false);
      },
      (error) => {
        setLocationError('Unable to retrieve your location: ' + error.message);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleRecenter = () => {
    if (userLocation && mapRef.current) {
      try {
        mapRef.current.flyTo?.({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 13,
          speed: 1.5
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('flyTo failed', e);
      }
    }
  };

  // --- Handlers ---
  const handlePlaceInputChange = (e) => setPlaceInput(e.target.value);

  const handlePlaceInputBlur = async () => {
    if (!placeInput) return;
    if (!geocodingClient) {
      setSubmitStatus({ type: 'error', message: 'Geocoding unavailable: missing Mapbox token.' });
      return;
    }
    try {
      const response = await geocodingClient
        .forwardGeocode({ query: placeInput, limit: 1 })
        .send();
      const match = response.body.features[0];
      if (match) {
        const [lng, lat] = match.center;
        setSelectedLocation({ latitude: lat, longitude: lng, name: match.place_name });
        setViewport((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      } else {
        setSubmitStatus({ type: 'error', message: 'No location match found.' });
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setSubmitStatus({ type: 'error', message: 'Geocoding failed. See console for details.' });
    }
  };

  const handleMapClick = (evt) => {
    if (!evt?.lngLat) return;
    const { lngLat } = evt;
    if (typeof lngLat.lng !== 'number' || typeof lngLat.lat !== 'number') return;
    setSelectedLocation({ latitude: lngLat.lat, longitude: lngLat.lng, name: "" });
    setPlaceInput("");
    setRoutePoints(prev => [...prev, [lngLat.lng, lngLat.lat]]);
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

  const validateForm = () => {
    if (!form.name.trim()) {
      setSubmitStatus({ type: 'error', message: 'Trail name is required' });
      return false;
    }
    if (!selectedLocation) {
      setSubmitStatus({ type: 'error', message: 'Please select a location on the map' });
      return false;
    }
    if (!form.distance || Number(form.distance) <= 0) {
      setSubmitStatus({ type: 'error', message: 'Please enter a valid distance' });
      return false;
    }
    if (!form.elevationGain || Number(form.elevationGain) < 0) {
      setSubmitStatus({ type: 'error', message: 'Please enter a valid elevation gain' });
      return false;
    }
    if (!form.description.trim()) {
      setSubmitStatus({ type: 'error', message: 'Trail description is required' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!currentUserId) {
      setSubmitStatus({ type: 'error', message: 'Please log in to submit a trail' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      // Upload photos first
      const photoUrls = await uploadPhotos(selectedFiles);

      // Get user's ID token for authentication
      const idToken = await auth.currentUser.getIdToken();

      // Prepare trail data according to our API schema
      const trailData = {
        name: form.name.trim(),
        location: {
          lat: selectedLocation.latitude,
          lng: selectedLocation.longitude
        },
        distance: Number(form.distance),
        elevationGain: Number(form.elevationGain),
        difficulty: form.difficulty,
        tags: form.tags,
        gpsRoute: routePoints.map(([lng, lat]) => ({ lat, lng })),
        description: form.description.trim(),
        photos: photoUrls,
        status: form.status
      };

      // Submit to our API
      const response = await fetch(`${API_BASE_URL}/submitTrail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(trailData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit trail');
      }

      setSubmitStatus({ 
        type: 'success', 
        message: `Trail "${form.name}" submitted successfully! Trail ID: ${result.trailId}` 
      });

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

    } catch (error) {
      console.error("Error submitting trail:", error);
      setSubmitStatus({ 
        type: 'error', 
        message: `Failed to submit trail: ${error.message}` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUserId) {
    return (
      <div className="container fade-in-up">
        <div className="card error">
          <h2>Authentication Required</h2>
          <p>Please log in to submit a trail.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in-up">
      <h1>Trail Submission</h1>
      <div className="card" style={{ padding: "1rem", marginTop: "1rem" }}>
        <p className="muted">Create or update a hiking trail.</p>

        {/* Status Messages */}
        {submitStatus.message && (
          <div className={`card ${submitStatus.type === 'success' ? 'success' : 'error'}`}>
            {submitStatus.type === 'success' ? '✅' : '⚠️'} {submitStatus.message}
          </div>
        )}

        {/* Location Controls */}
        <div style={{marginTop: '1rem', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap'}}>
          <button 
            className="button secondary"
            onClick={getUserLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? 'Locating...' : '📍 Find My Location'}
          </button>
          {userLocation && (
            <span>
              Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </span>
          )}
        </div>

        {locationError && (
          <div className="card error">
            ⚠️ {locationError}
          </div>
        )}

        <div className="grid cols-2" style={{ marginTop: ".5rem" }}>
          {/* Map */}
          <div style={{borderRadius: '8px', overflow: 'hidden', minHeight: '400px', height: '600px', border: '1px solid #ccc', position: 'relative'}}>
            {!MAPBOX_TOKEN ? (
              <div style={{padding: '2rem', textAlign: 'center'}}>
                <p style={{margin: 0}}>Map disabled (missing Mapbox token).</p>
              </div>
            ) : (
              <Map
                ref={mapRef}
                {...viewport}
                mapboxAccessToken={MAPBOX_TOKEN}
                mapStyle="mapbox://styles/mapbox/standard"
                onMove={(evt) => evt?.viewState && setViewport(evt.viewState)}
                onClick={handleMapClick}
                onError={(e) => { /* eslint-disable-next-line no-console */ console.error('Map error', e?.error); }}
                style={{width: '100%', height: '100%'}}
              >
                {userLocation && (
                  <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center">
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#4285F4', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
                  </Marker>
                )}

                {selectedLocation && (
                  <Marker
                    latitude={selectedLocation.latitude}
                    longitude={selectedLocation.longitude}
                    color="red"
                    draggable
                    onDragEnd={(evt) => evt?.lngLat && setSelectedLocation({ latitude: evt.lngLat.lat, longitude: evt.lngLat.lng, name: "" })}
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
                      geometry: { type: "LineString", coordinates: routePoints.filter(pt => Array.isArray(pt) && pt.length === 2) },
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
            )}
            {userLocation && MAPBOX_TOKEN && (
              <button
                onClick={handleRecenter}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  zIndex: 1,
                  color: '#333',
                  padding: '8px 12px',
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                Recenter
              </button>
            )}
          </div>

          {/* Form */}
          <div>
            {!MAPBOX_TOKEN && (
              <div className="card error" style={{ marginBottom: '1rem' }}>
                ⚠️ Map functionality limited: set REACT_APP_MAPBOX_TOKEN in a .env.local file to enable full geocoding & styled maps.
              </div>
            )}
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

            <button 
              className="button" 
              style={{ marginTop: "1rem" }} 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Trail'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
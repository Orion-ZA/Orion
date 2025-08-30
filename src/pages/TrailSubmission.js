import React, { useState, useEffect, useRef } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import mbxClient from "@mapbox/mapbox-sdk/services/geocoding";
import { collection, addDoc, GeoPoint, doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebaseConfig";
import { v4 as uuidv4 } from "uuid";

const geocodingClient = mbxClient({ accessToken: process.env.REACT_APP_MAPBOX_TOKEN });

export default function TrailSubmission() {
  const mapRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
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
    if (userLocation) {
      mapRef.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 13,
        speed: 1.5
      });
    }
  };

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
      // TODO: REMOVE THIS ALERT - Replace with proper error handling for production
      console.error("User not logged in - cannot submit trail");
      return;
    }

    if (!form.name || !selectedLocation) {
      // TODO: REMOVE THIS ALERT - Replace with proper validation UI for production
      console.error("Missing required fields: name or location");
      return;
    }

    try {
      const photoUrls = await uploadPhotos(selectedFiles);

      // Create trail document following the exact schema
      const trailData = {
        name: form.name,
        location: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude
        },
        distance: Number(form.distance),
        elevationGain: Number(form.elevationGain),
        difficulty: form.difficulty,
        tags: form.tags,
        gpsRoute: routePoints.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
        description: form.description,
        photos: photoUrls,
        status: {
          status: form.status,
          lastUpdated: new Date().toISOString()
        },
        createdBy: currentUserId,
        createdAt: new Date().toISOString(), // TODO: REMOVE - Use serverTimestamp() for production
        updatedAt: new Date().toISOString() // TODO: REMOVE - Use serverTimestamp() for production
      };

             // TODO: REMOVE THIS LOGGING SECTION - For development/debugging only
       console.log("=== TRAIL SUBMISSION DEBUG LOG ===");
       console.log("User ID:", currentUserId);
       console.log("Trail Data to Submit:");
       console.log(JSON.stringify(trailData, null, 2));
       console.log("=== END DEBUG LOG ===");

       // TODO: UNCOMMENT FOR PRODUCTION - Submit to Firestore database (PERMISSION ISSUE - DISABLED)
       // const trailDataWithTimestamps = {
       //   ...trailData,
       //   createdAt: serverTimestamp(),
       //   updatedAt: serverTimestamp()
       // };
       // const trailRef = await addDoc(collection(db, "Trails"), trailDataWithTimestamps);
       // console.log("Trail submitted successfully with ID:", trailRef.id);

       // TODO: UNCOMMENT FOR PRODUCTION - Update user's submittedTrails array (PERMISSION ISSUE - DISABLED)
       // const userRef = doc(db, "Users", currentUserId);
       // await updateDoc(userRef, {
       //   submittedTrails: arrayUnion(trailRef.id)
       // });

       // TODO: REMOVE THIS ALERT - Replace with success notification for production
       console.log("Trail data prepared and logged successfully!");
      
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
      // TODO: REMOVE THIS ALERT - Replace with proper error handling for production
      console.error("Error preparing trail data:", err);
      console.error("Error details:", err.message);
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
          <div style={{borderRadius: '8px', overflow: 'hidden', height: '600px', border: '1px solid #ccc', position: 'relative'}}>
            <Map
              ref={mapRef}
              {...viewport}
              mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
              mapStyle="mapbox://styles/mapbox/standard"
              onMove={(evt) => setViewport(evt.viewState)}
              onClick={handleMapClick}
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
            {userLocation && (
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
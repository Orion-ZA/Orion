import React, { useState, useEffect } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mbxClient from "@mapbox/mapbox-sdk/services/geocoding";
import { collection, addDoc, GeoPoint } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebaseConfig"; // corrected import
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
    difficulty: "Easy",
    status: "Open",
  });

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

      await addDoc(collection(db, "Trails"), {
        name: form.name,
        description: form.description,
        distance: Number(form.distance),
        difficulty: form.difficulty,
        status: [form.status],
        location: new GeoPoint(selectedLocation.latitude, selectedLocation.longitude),
        gpsRoute: routePoints.map(([lng, lat]) => new GeoPoint(lat, lng)),
        photos: photoUrls,
        createdBy: currentUserId,
      });

      alert("Trail submitted successfully!");
      setForm({ name: "", description: "", distance: "", difficulty: "Easy", status: "Open" });
      setSelectedFiles([]);
      setRoutePoints([]);
      setPlaceInput("");
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
              mapStyle="mapbox://styles/mapbox/streets-v12"
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
            <label>Name</label>
            <input
              className="input"
              placeholder="Trail name"
              name="name"
              value={form.name}
              onChange={handleFormChange}
            />

            <label>Location</label>
            <input
              className="input"
              placeholder="Enter place name"
              value={placeInput}
              onChange={handlePlaceInputChange}
              onBlur={handlePlaceInputBlur}
              onKeyDown={(e) => e.key === "Enter" && handlePlaceInputBlur()}
            />

            <label>Distance (mi)</label>
            <input
              className="input"
              type="number"
              placeholder="Distance"
              name="distance"
              value={form.distance}
              onChange={handleFormChange}
            />

            <label>Difficulty</label>
            <select className="input" name="difficulty" value={form.difficulty} onChange={handleFormChange}>
              <option>Easy</option>
              <option>Moderate</option>
              <option>Hard</option>
            </select>

            <label>Status</label>
            <select className="input" name="status" value={form.status} onChange={handleFormChange}>
              <option>Open</option>
              <option>Closed</option>
            </select>

            <label>Description</label>
            <textarea
              className="input"
              rows="4"
              placeholder="Trail highlights, terrain, best season..."
              name="description"
              value={form.description}
              onChange={handleFormChange}
            />

            <label>Photos</label>
            <input type="file" multiple onChange={handleFileChange} />

            <button className="button" style={{ marginTop: "1rem" }} onClick={handleSubmit}>
              Submit Trail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

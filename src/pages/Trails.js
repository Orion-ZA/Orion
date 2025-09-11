import React, { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import useTrails from '../components/hooks/useTrails';
import FilterPanel from '../components/filters/FilterPanel';
import TrailMap from '../components/trails/TrailMap';
import MapControls from '../components/trails/MapControls';
import TrailsPanel from '../components/trails/TrailsPanel';
import TrailSubmission from '../components/trails/TrailSubmission';
import { calculateDistance } from '../components/trails/TrailUtils';
import './Trails.css';

const API_BASE_URL = 'https://us-central1-orion-sdp.cloudfunctions.net';

export default function TrailsPage() {
  const mapRef = useRef(null);
  const [user, setUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showSubmissionPanel, setShowSubmissionPanel] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredTrail, setHoveredTrail] = useState(null);
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [userSaved, setUserSaved] = useState({ favourites: [], wishlist: [], completed: [] });
  
  // Map state tracking
  const [mapBearing, setMapBearing] = useState(0);
  const [mapPitch, setMapPitch] = useState(0);
  const [mapCenter, setMapCenter] = useState(null);
  
  // Trail submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  // Trail explorer state
  const [trailsUserLocation, setTrailsUserLocation] = useState(null);
  const [trailsLocationError, setTrailsLocationError] = useState(null);
  const [trailsIsLoadingLocation, setTrailsIsLoadingLocation] = useState(false);
  const [viewport, setViewport] = useState({
    longitude: 28.0473,
    latitude: -26.2041,
    zoom: 10
  });

  // Use trails hook
  const { trails, isLoadingTrails, filters, handleFilterChange, filteredTrails } = useTrails(trailsUserLocation);

  // Auto-detect user location on component mount
  useEffect(() => {
    getTrailsUserLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load user's saved trails
  const loadUserSavedTrails = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/getSavedTrails?uid=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Extract trail IDs from the resolved trail objects
        setUserSaved({
          favourites: data.favourites?.map(trail => trail.id) || [],
          wishlist: data.wishlist?.map(trail => trail.id) || [],
          completed: data.completed?.map(trail => trail.id) || []
        });
      } else {
        console.error('Failed to load user saved trails');
        setUserSaved({ favourites: [], wishlist: [], completed: [] });
      }
    } catch (error) {
      console.error('Error loading user saved trails:', error);
      setUserSaved({ favourites: [], wishlist: [], completed: [] });
    }
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setCurrentUserId(user.uid);
        loadUserSavedTrails(user.uid);
      } else {
        setCurrentUserId(null);
        setUserSaved({ favourites: [], wishlist: [], completed: [] });
      }
    });

    return () => unsubscribe();
  }, []);

  // Get user location for trails
  const getTrailsUserLocation = () => {
    setTrailsIsLoadingLocation(true);
    setTrailsLocationError(null);
    
    if (!navigator.geolocation) {
      setTrailsLocationError('Geolocation is not supported');
      setTrailsIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
        setTrailsUserLocation(location);
        setTrailsIsLoadingLocation(false);
        
        // Center map on user location
        setViewport(prev => ({
          ...prev,
          longitude: location.longitude,
          latitude: location.latitude,
          zoom: 12
        }));
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Failed to get location';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
        }
        
        setTrailsLocationError(errorMessage);
        setTrailsIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,    // Use GPS if available
        maximumAge: 300000          // Accept cached location up to 5 minutes old
      }
    );
  };

  // Map control functions
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  const handleResetNorth = () => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.easeTo({ bearing: 0, pitch: 0 });
    }
  };

  const handleRecenter = () => {
    if (trailsUserLocation && mapRef.current) {
      const map = mapRef.current.getMap();
      
      // Use smooth transition with easeTo
      map.easeTo({
        center: [trailsUserLocation.longitude, trailsUserLocation.latitude],
        zoom: 12,
        duration: 1500, // 1.5 second smooth transition
        essential: true // This animation is considered essential with respect to prefers-reduced-motion
      });
    }
  };

  // Handle trail click to center and zoom map
  const handleTrailClick = (trail) => {
    if (trail.longitude && trail.latitude && mapRef.current) {
      const map = mapRef.current.getMap();
      
      // Use smooth transition with easeTo
      map.easeTo({
        center: [trail.longitude, trail.latitude],
        zoom: 15, // Zoom in closer for individual trail view
        duration: 1500, // 1.5 second smooth transition
        essential: true // This animation is considered essential with respect to prefers-reduced-motion
      });
      
      setSelectedTrail(trail); // Set as selected trail for panel highlighting
    }
  };

  // Check if map needs recentering
  const needsRecenter = trailsUserLocation && mapCenter && 
    calculateDistance(
      trailsUserLocation.latitude,
      trailsUserLocation.longitude,
      mapCenter.lat,
      mapCenter.lng
    ) > 1; // More than 1km away

  // Show find location button if location failed or not found
  const showFindLocation = trailsLocationError || !trailsUserLocation;

  // Handle trail actions (favourites, wishlist, completed)
  const handleTrailAction = async (trailId, action) => {
    if (!currentUserId) return;

    try {
      const isCurrentlySaved = userSaved[action].includes(trailId);
      let endpoint;
      
      // Determine the correct endpoint based on action and current state
      if (action === 'favourites') {
        endpoint = isCurrentlySaved ? 'removeFavourite' : 'addFavourite';
      } else if (action === 'wishlist') {
        endpoint = isCurrentlySaved ? 'removeWishlist' : 'addWishlist';
      } else if (action === 'completed') {
        endpoint = isCurrentlySaved ? 'removeCompleted' : 'markCompleted';
      }

      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUserId,
          trailId
        }),
      });

      if (response.ok) {
        setUserSaved(prev => ({
          ...prev,
          [action]: isCurrentlySaved
            ? prev[action].filter(id => id !== trailId)
            : [...prev[action], trailId]
        }));
      } else {
        console.error('Failed to update user trails');
      }
    } catch (error) {
      console.error('Error updating user trails:', error);
    }
  };

  // Handle trail submission
  const handleTrailSubmission = async (trailData) => {
    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/submitTrail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...trailData,
          createdBy: currentUserId
        }),
      });

      if (response.ok) {
        setSubmitStatus({ 
          type: 'success', 
          message: 'Trail submitted successfully!' 
        });
        setShowSubmissionPanel(false);
        // Refresh trails data
        window.location.reload();
      } else {
        const errorData = await response.json();
        setSubmitStatus({ 
          type: 'error', 
          message: errorData.error || 'Failed to submit trail' 
        });
      }
    } catch (error) {
      console.error('Error submitting trail:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: 'Failed to submit trail. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="trails-page">
      <div className="trails-main">
        <TrailMap
          viewport={viewport}
          setViewport={setViewport}
          mapRef={mapRef}
          trails={filteredTrails}
          hoveredTrail={hoveredTrail}
          setHoveredTrail={setHoveredTrail}
          selectedTrail={selectedTrail}
          setSelectedTrail={setSelectedTrail}
          onTrailClick={handleTrailClick}
          userLocation={trailsUserLocation}
          mapBearing={mapBearing}
          setMapBearing={setMapBearing}
          mapPitch={mapPitch}
          setMapPitch={setMapPitch}
          mapCenter={mapCenter}
          setMapCenter={setMapCenter}
        />

        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetNorth={handleResetNorth}
          onRecenter={handleRecenter}
          onFindLocation={getTrailsUserLocation}
          mapBearing={mapBearing}
          mapPitch={mapPitch}
          mapCenter={mapCenter}
          userLocation={trailsUserLocation}
          needsRecenter={needsRecenter}
          showFindLocation={showFindLocation}
          isLoadingLocation={trailsIsLoadingLocation}
        />

        <TrailsPanel
          isPanelOpen={isPanelOpen}
          setIsPanelOpen={setIsPanelOpen}
          filteredTrails={filteredTrails}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          setShowSubmissionPanel={setShowSubmissionPanel}
          userSaved={userSaved}
          handleTrailAction={handleTrailAction}
          currentUserId={currentUserId}
          onTrailClick={handleTrailClick}
          selectedTrail={selectedTrail}
          setSelectedTrail={setSelectedTrail}
          userLocation={trailsUserLocation}
        />
      </div>

      {/* Filter Panel Overlay */}
      {showFilters && (
        <div className="filter-overlay">
          <FilterPanel 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onClose={() => setShowFilters(false)}
          />
        </div>
      )}

      {/* Trail Submission Panel */}
      <TrailSubmission
        isOpen={showSubmissionPanel}
        onClose={() => setShowSubmissionPanel(false)}
        onSubmit={handleTrailSubmission}
        isSubmitting={isSubmitting}
        submitStatus={submitStatus}
      />

      {/* Location Error */}
      {trailsLocationError && (
        <div className="error-overlay">
          <p>{trailsLocationError}</p>
          <button onClick={getTrailsUserLocation} className="button secondary">
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoadingTrails && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading trails...</p>
        </div>
      )}
    </div>
  );
}

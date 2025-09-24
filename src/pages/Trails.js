import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useLocation } from 'react-router-dom';
import { auth, db } from "../firebaseConfig";
import useTrails from '../components/hooks/useTrails';
import { useSearch } from '../components/SearchContext';
import FilterPanel from '../components/filters/FilterPanel';
import TrailMap from '../components/trails/TrailMap';
import MapControls from '../components/trails/MapControls';
import TrailsPanel from '../components/trails/TrailsPanel';
import TrailSubmission from '../components/trails/TrailSubmission';
import TrailEdit from '../components/trails/TrailEdit';
import SearchBar from '../components/SearchBar';
import { calculateDistance } from '../components/trails/TrailUtils';
import './Trails.css';

const API_BASE_URL = 'https://us-central1-orion-sdp.cloudfunctions.net';

export default function TrailsPage() {
  const mapRef = useRef(null);
  const location = useLocation();
  const { searchQuery, setSearchQuery, updateTrailsData, getLocationCoordinates, getLocationNameFromCoordinates } = useSearch();
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
  const [submissionLocation, setSubmissionLocation] = useState(null);
  const [submissionRoute, setSubmissionRoute] = useState([]);
  const [submissionDrawingState, setSubmissionDrawingState] = useState({ isDrawing: false, addRoutePoint: null });
  
  // Edit trail state
  const [isEditMode, setIsEditMode] = useState(false);
  const [trailToEdit, setTrailToEdit] = useState(null);

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
  const { trails, isLoadingTrails, filters, handleFilterChange, filteredTrails } = useTrails(trailsUserLocation, currentUserId);

  // Update search context with trails data
  useEffect(() => {
    if (trails && trails.length > 0) {
      updateTrailsData(trails);
    }
  }, [trails, updateTrailsData]);

  // Handle search query from Welcome page or search bar
  useEffect(() => {
    if (location.state?.searchQuery) {
      setSearchQuery(location.state.searchQuery);
      
      if (location.state.action === 'zoom') {
        // Handle zoom action - find and zoom to the trail or location
        handleSearchZoom(location.state.searchQuery);
      } else {
        // Legacy behavior - filter trails (keeping for backward compatibility)
        handleFilterChange('searchQuery', location.state.searchQuery);
      }
      
      // Clear the state to prevent re-applying on re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state, setSearchQuery, handleFilterChange]);

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
        
        // Smooth transition to user location using map.easeTo
        if (mapRef.current) {
          const map = mapRef.current.getMap();
          map.easeTo({
            center: [location.longitude, location.latitude],
            zoom: 14,
            duration: 2000, // 2 second smooth transition
            essential: true
          });
        } else {
          // Fallback to viewport update if map not ready
          setViewport(prev => ({
            ...prev,
            longitude: location.longitude,
            latitude: location.latitude,
            zoom: 14
          }));
        }
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
        zoom: 14,
        duration: 2000, // 2 second smooth transition
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

  // Handle search zoom - find trail or location and zoom to it
  const handleSearchZoom = useCallback(async (query) => {
    if (!query || !mapRef.current) return;

    // First, try to find a matching trail (only if trails data is available)
    const matchingTrail = trails && trails.length > 0 ? trails.find(trail => 
      trail.name && trail.name.toLowerCase().includes(query.toLowerCase())
    ) : null;

    if (matchingTrail && matchingTrail.longitude && matchingTrail.latitude) {
      // Found a matching trail - zoom to it
      handleTrailClick(matchingTrail);
      return;
    }

    // If no trail found, try to get coordinates from geocoding
    try {
      const coordinates = await getLocationCoordinates(query);
      
      if (coordinates && coordinates.latitude && coordinates.longitude) {
        const map = mapRef.current.getMap();
        
        // Zoom to the geocoded location
        map.easeTo({
          center: [coordinates.longitude, coordinates.latitude],
          zoom: 15, // Increased zoom level for more detailed view
          duration: 1500,
          essential: true
        });
        
        // Clear any selected trail since we're zooming to a location
        setSelectedTrail(null);
      }
    } catch (error) {
      console.warn('Failed to geocode search query:', error);
    }
  }, [trails, getLocationCoordinates, handleTrailClick]);

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

  // Handle map click for trail submission
  const handleMapClickForSubmission = useCallback(async (evt) => {
    if (showSubmissionPanel) {
      const { lngLat } = evt;
      
      // If we're in drawing mode, add to route
      if (submissionDrawingState.isDrawing && submissionDrawingState.addRoutePoint) {
        submissionDrawingState.addRoutePoint(lngLat.lng, lngLat.lat);
      } else {
        // Get location name using reverse geocoding
        let locationName = '';
        try {
          const locationInfo = await getLocationNameFromCoordinates([lngLat.lng, lngLat.lat]);
          if (locationInfo) {
            locationName = locationInfo.name || locationInfo.fullAddress || '';
          }
        } catch (error) {
          console.warn('Failed to get location name:', error);
        }
        
        // Set the submission location with name
        setSubmissionLocation({
          latitude: lngLat.lat,
          longitude: lngLat.lng,
          name: locationName
        });
      }
    }
  }, [showSubmissionPanel, submissionDrawingState, getLocationNameFromCoordinates]);

  // Handle general map clicks to get location information using reverse geocoding
  const handleMapClick = useCallback(async (evt) => {
    const { lngLat } = evt;
    const coordinates = [lngLat.lng, lngLat.lat];
    
    try {
      const locationInfo = await getLocationNameFromCoordinates(coordinates);
      if (locationInfo) {
        console.log('Clicked location:', locationInfo);
        // You can use this information to show a tooltip, update UI, etc.
        // For now, we'll just log it, but you could show it in a toast or modal
      }
    } catch (error) {
      console.warn('Failed to get location info for clicked coordinates:', error);
    }
  }, [getLocationNameFromCoordinates]);

  // Handle route updates from submission panel
  const handleRouteUpdate = useCallback((routePoints, drawingState) => {
    setSubmissionRoute(routePoints);
    if (drawingState) {
      setSubmissionDrawingState(drawingState);
    }
  }, []);

  // Handle trail submission
  const handleTrailSubmission = async (trailData) => {
    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      // Get user's ID token for authentication
      const idToken = await auth.currentUser.getIdToken();

      const response = await fetch(`${API_BASE_URL}/submitTrail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(trailData),
      });

      const result = await response.json();

      if (response.ok) {
        //get the trail id
        const trailId = result.trailId;

        //create a doc reference to new the new trail
        const trailRef = doc(db, "Trails", trailId);
        //update the doc with the id
        const userRef = doc(db, "Users", currentUserId);

        await updateDoc(userRef, 
          { submittedTrails: arrayUnion(trailRef)
        });

        setSubmitStatus({ 
          type: 'success', 
          message: `Trail "${trailData.name}" submitted successfully! Trail ID: ${trailId}`
        });
        setShowSubmissionPanel(false);
        setSubmissionLocation(null);
        setSubmissionRoute([]);
        setSubmissionDrawingState({ isDrawing: false, addRoutePoint: null });
        // Refresh trails data
        window.location.reload();
      } else {
        setSubmitStatus({ 
          type: 'error', 
          message: result.error || 'Failed to submit trail' 
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

  // Handle trail update
  const handleTrailUpdate = async (trailData) => {
    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      // Import GeoPoint from Firestore
      const { GeoPoint } = await import('firebase/firestore');
      
      // Update directly to Firestore database
      const trailRef = doc(db, 'Trails', trailData.id);
      
      // Prepare the update data (exclude id from the update)
      const { id, ...updateData } = trailData;
      
      // Convert location to GeoPoint if provided
      if (updateData.location && updateData.location.lat && updateData.location.lng) {
        updateData.location = new GeoPoint(updateData.location.lat, updateData.location.lng);
      }
      
      // Convert GPS route to GeoPoint objects if provided
      if (updateData.gpsRoute && Array.isArray(updateData.gpsRoute) && updateData.gpsRoute.length > 0) {
        updateData.gpsRoute = updateData.gpsRoute.map(point => new GeoPoint(point.lat, point.lng));
      }
      
      // Add timestamp
      updateData.updatedAt = new Date().toISOString();
      
      await updateDoc(trailRef, updateData);

      setSubmitStatus({ 
        type: 'success', 
        message: `Trail "${trailData.name}" updated successfully!` 
      });
      setShowSubmissionPanel(false);
      setIsEditMode(false);
      setTrailToEdit(null);
      setSubmissionLocation(null);
      setSubmissionRoute([]);
      setSubmissionDrawingState({ isDrawing: false, addRoutePoint: null });
      // Refresh trails data
      window.location.reload();
    } catch (error) {
      console.error('Error updating trail:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: 'Failed to update trail. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle trail deletion (set status to closed)
  const handleTrailDelete = async (trailId) => {
    setIsSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      // Update the trail status to closed
      const trailRef = doc(db, 'Trails', trailId);
      await updateDoc(trailRef, {
        status: 'closed',
        updatedAt: new Date().toISOString()
      });

      setSubmitStatus({ 
        type: 'success', 
        message: 'Trail deleted successfully!' 
      });
      
      // Close the edit panel
      setShowSubmissionPanel(false);
      setIsEditMode(false);
      setTrailToEdit(null);
      setSubmissionLocation(null);
      setSubmissionRoute([]);
      setSubmissionDrawingState({ isDrawing: false, addRoutePoint: null });
      
      // Refresh trails data
      window.location.reload();
    } catch (error) {
      console.error('Error deleting trail:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: 'Failed to delete trail. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit trail
  const handleEditTrail = (trail) => {
    setTrailToEdit(trail);
    setIsEditMode(true);
    setShowSubmissionPanel(true);
    
    // Set the location for the trail being edited
    setSubmissionLocation({
      latitude: trail.latitude,
      longitude: trail.longitude,
      name: trail.name
    });
    
    // Set the route if it exists
    if (trail.gpsRoute && trail.gpsRoute.length > 0) {
      setSubmissionRoute(trail.gpsRoute.map(point => [point.lng, point.lat]));
    }
  };

  return (
    <div className="trails-page">
      {/* Search Bar */}
      <div className="trails-search-container">
        <SearchBar 
          placeholder="Search trails, locations, or activities..."
          initialValue={searchQuery}
          onSearch={(query) => {
            setSearchQuery(query);
            handleSearchZoom(query);
          }}
        />
      </div>
      
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
          onMapClick={handleMapClickForSubmission}
          onGeneralMapClick={handleMapClick}
          userLocation={trailsUserLocation}
          mapBearing={mapBearing}
          setMapBearing={setMapBearing}
          mapPitch={mapPitch}
          setMapPitch={setMapPitch}
          mapCenter={mapCenter}
          setMapCenter={setMapCenter}
          submissionLocation={submissionLocation}
          showSubmissionPanel={showSubmissionPanel}
          submissionRoute={submissionRoute}
          onCloseSubmission={() => {
            setShowSubmissionPanel(false);
            setSubmissionLocation(null);
            setSubmissionRoute([]);
            setSubmissionDrawingState({ isDrawing: false, addRoutePoint: null });
          }}
          isLoading={isLoadingTrails || trailsIsLoadingLocation}
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
          onEditTrail={handleEditTrail}
        />
      </div>

      {/* Filter Panel Overlay */}
      {showFilters && (
        <div className="filter-overlay">
          <FilterPanel 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onClose={() => setShowFilters(false)}
            currentUserId={currentUserId}
          />
        </div>
      )}

      {/* Trail Submission Panel */}
      {showSubmissionPanel && (
        <>
          {isEditMode ? (
            <TrailEdit
              isOpen={showSubmissionPanel}
              onClose={() => {
                setShowSubmissionPanel(false);
                setIsEditMode(false);
                setTrailToEdit(null);
                setSubmissionLocation(null);
                setSubmissionRoute([]);
                setSubmissionDrawingState({ isDrawing: false, addRoutePoint: null });
              }}
              onSubmit={handleTrailUpdate}
              onDelete={handleTrailDelete}
              isSubmitting={isSubmitting}
              submitStatus={submitStatus}
              selectedLocation={submissionLocation}
              onLocationSelect={setSubmissionLocation}
              onRouteUpdate={handleRouteUpdate}
              editTrailData={trailToEdit}
            />
          ) : (
            <TrailSubmission
              isOpen={showSubmissionPanel}
              onClose={() => {
                setShowSubmissionPanel(false);
                setSubmissionLocation(null);
                setSubmissionRoute([]);
                setSubmissionDrawingState({ isDrawing: false, addRoutePoint: null });
              }}
              onSubmit={handleTrailSubmission}
              isSubmitting={isSubmitting}
              submitStatus={submitStatus}
              selectedLocation={submissionLocation}
              onLocationSelect={setSubmissionLocation}
              onRouteUpdate={handleRouteUpdate}
            />
          )}
        </>
      )}

      {/* Location Error */}
      {trailsLocationError && (
        <div className="error-overlay">
          <p>{trailsLocationError}</p>
          <button onClick={getTrailsUserLocation} className="button secondary">
            Try Again
          </button>
        </div>
      )}

      {/* Map-scoped loader handled inside TrailMap via isLoading prop */}
    </div>
  );
}

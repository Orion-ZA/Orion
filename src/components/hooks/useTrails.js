// src/components/hooks/useTrails.js
import { useState, useMemo, useCallback, useEffect } from 'react';

const API_BASE = "https://us-central1-orion-sdp.cloudfunctions.net";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

// Helper function to extract coordinates from trail location
const getTrailCoordinates = (location) => {
  if (!location) return { latitude: null, longitude: null };
  
  // Handle both formats: {latitude, longitude} and {_latitude, _longitude}
  const lat = location.latitude || location._latitude;
  const lng = location.longitude || location._longitude;
  
  // Convert to numbers and validate
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  return {
    latitude: isNaN(latitude) ? null : latitude,
    longitude: isNaN(longitude) ? null : longitude
  };
};

export default function useTrails() {
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tags: 'all',
    minDistance: 0,
    maxDistance: 20,
    maxLocationDistance: 80
  });
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [trails, setTrails] = useState([]);
  const [loadingTrails, setLoadingTrails] = useState(false);
  const [trailError, setTrailError] = useState(null);

  // Fetch trails from API
  useEffect(() => {
    const fetchTrails = async () => {
      setLoadingTrails(true);
      setTrailError(null);

      try {
        // build query params from filters if needed
        const params = new URLSearchParams();
        if (filters.difficulty !== 'all') {
          params.append("difficulty", filters.difficulty);
        }

        const res = await fetch(`${API_BASE}/getTrails?${params.toString()}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setTrails(data);
      } catch (err) {
        console.error("Failed to fetch trails:", err);
        setTrailError(err.message);
      } finally {
        setLoadingTrails(false);
      }
    };

    fetchTrails();
  }, [filters.difficulty]); // refetch if difficulty filter changes

  const getUserLocation = useCallback(() => {
    setIsLoadingLocation(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported');
      setIsLoadingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setIsLoadingLocation(false);
      },
      (err) => {
        setLocationError('Unable to get location: ' + err.message);
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  }, []);

  const filteredTrails = useMemo(() => {
    return trails.filter(trail => {
      let withinDistance = true;
      
      // Get coordinates using the helper function
      const { latitude, longitude } = getTrailCoordinates(trail.location);
      
      if (userLocation && filters.maxLocationDistance > 0 && latitude && longitude) {
        const dist = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          latitude,
          longitude
        );
        withinDistance = dist <= filters.maxLocationDistance;
      }

      const hasMatchingTag =
        filters.tags === 'all' ||
        (trail.tags || []).some(tag =>
          tag.toLowerCase().includes(filters.tags.toLowerCase())
        );

      return (
        (filters.difficulty === 'all' || trail.difficulty === filters.difficulty) &&
        hasMatchingTag &&
        trail.distance >= filters.minDistance &&
        trail.distance <= filters.maxDistance &&
        withinDistance
      );
    });
  }, [trails, filters, userLocation]);

  return {
    filteredTrails,
    filters,
    handleFilterChange,
    userLocation,
    locationError,
    isLoadingLocation,
    getUserLocation,
    calculateDistance,
    loadingTrails,
    trailError,
    getTrailCoordinates // Export this for use in components
  };
}
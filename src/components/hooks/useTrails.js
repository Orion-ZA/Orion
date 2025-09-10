import { useState, useMemo, useCallback, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Adjust the path to your Firebase config

// Reusable function to calculate distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function useTrails(searchLocation) {
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tags: [],
    minDistance: 0,
    maxDistance: 20,
    maxLocationDistance: 80,
    searchQuery: ''
  });
  const [userLocation, setUserLocation] = useState(searchLocation || null);
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [trails, setTrails] = useState([]);
  const [isLoadingTrails, setIsLoadingTrails] = useState(false);

  // Fetch trails from Firestore
  const fetchTrails = useCallback(async () => {
    setIsLoadingTrails(true);
    try {
      const trailsCollection = collection(db, 'Trails');
      const trailsSnapshot = await getDocs(trailsCollection);
      const trailsData = trailsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          difficulty: data.difficulty,
          distance: data.distance,
          elevationGain: data.elevationGain,
          rating: data.rating || 4.5,
          gpsRoute: data.gpsRoute.map(point => ({
            latitude: point.latitude,
            longitude: point.longitude
          })),
          location: {
            latitude: data.location.latitude,
            longitude: data.location.longitude
          },
          description: data.description,
          tags: data.tags || [],
          photos: data.photos || [],
          status: data.status,
          createdBy: data.createdBy.path
        };
      });
      setTrails(trailsData);
    } catch (error) {
      console.error('Error fetching trails:', error);
      setLocationError('Failed to load trails. Please try again.');
    } finally {
      setIsLoadingTrails(false);
    }
  }, []);

  // Fetch trails on mount
  useEffect(() => {
    fetchTrails();
  }, [fetchTrails]);

  // Get user location if searchLocation is not provided
  const getUserLocation = useCallback(() => {
    if (searchLocation) return; // Skip geolocation if searchLocation is provided
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
  }, [searchLocation]);

  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  const filteredTrails = useMemo(() => {
    return trails.filter(trail => {
      let withinDistance = true;
      if (userLocation && filters.maxLocationDistance > 0) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          trail.location.latitude,
          trail.location.longitude
        );
        withinDistance = distance <= filters.maxLocationDistance;
      }

      const hasMatchingTag = filters.tags.length === 0 || 
        (trail.tags && filters.tags.every(filterTag => 
          trail.tags.some(trailTag => trailTag.toLowerCase() === filterTag.toLowerCase())
        ));

      const hasMatchingName = filters.searchQuery === '' ||
        trail.name.toLowerCase().includes(filters.searchQuery.toLowerCase());

      return (
        (filters.difficulty === 'all' || trail.difficulty === filters.difficulty) &&
        hasMatchingTag &&
        trail.distance >= filters.minDistance &&
        trail.distance <= filters.maxDistance &&
        withinDistance &&
        hasMatchingName
      );
    });
  }, [filters, userLocation, trails]);

  return {
    filteredTrails,
    filters,
    handleFilterChange,
    userLocation,
    locationError,
    isLoadingLocation,
    getUserLocation,
    calculateDistance,
    isLoadingTrails
  };
}
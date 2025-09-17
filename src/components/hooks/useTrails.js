import { useState, useMemo, useCallback, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Adjust the path to your Firebase config

// Reusable function to calculate distance
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
  
  // Validate that coordinates are valid numbers and within reasonable ranges
  const isValidLat = !isNaN(latitude) && latitude >= -90 && latitude <= 90;
  const isValidLng = !isNaN(longitude) && longitude >= -180 && longitude <= 180;
  
  return {
    latitude: isValidLat ? latitude : null,
    longitude: isValidLng ? longitude : null
  };
};

export default function useTrails(externalUserLocation = null, currentUserId = null) {
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tags: [],
    minDistance: 0,
    maxDistance: 20,
    maxLocationDistance: 80,
    searchQuery: '',
    showAll: false,
    myTrails: false
  });
  const [userLocation, setUserLocation] = useState(null);
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
        
        // Safely extract coordinates
        const { latitude, longitude } = getTrailCoordinates(data.location);
        
        // Debug logging for invalid coordinates
        if (isNaN(latitude) || isNaN(longitude)) {
          console.warn('Invalid coordinates found for trail:', data.name, { latitude, longitude, location: data.location });
        }
        
        return {
          id: doc.id,
          name: data.name || 'Unnamed Trail',
          difficulty: data.difficulty || 'Unknown',
          distance: data.distance || 0,
          elevationGain: data.elevationGain || 0,
          rating: data.rating || 4.5,
          route: data.gpsRoute && Array.isArray(data.gpsRoute) 
            ? (() => {
                const processedRoute = data.gpsRoute
                  .map(point => {
                    // Handle Firestore GeoPoint objects which have _latitude and _longitude properties
                    const lng = parseFloat(point.lng || point.longitude || point._longitude);
                    const lat = parseFloat(point.lat || point.latitude || point._latitude);
                    // Only include valid coordinates
                    if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
                      return [lng, lat];
                    }
                    return null;
                  })
                  .filter(point => point !== null); // Remove invalid points
                
                
                return processedRoute;
              })()
            : latitude && longitude ? [[longitude, latitude]] : [],
          latitude: latitude,
          longitude: longitude,
          location: {
            latitude: latitude,
            longitude: longitude
          },
          description: data.description || '',
          tags: data.tags || [],
          photos: data.photos || [],
          status: data.status || 'active',
          createdBy: data.createdBy?.path || data.createdBy || 'unknown',
          gpsRoute: data.gpsRoute && Array.isArray(data.gpsRoute) 
            ? data.gpsRoute
                .map(point => {
                  // Handle Firestore GeoPoint objects which have _latitude and _longitude properties
                  const lng = parseFloat(point.lng || point.longitude || point._longitude);
                  const lat = parseFloat(point.lat || point.latitude || point._latitude);
                  // Only include valid coordinates
                  if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
                    return { lng, lat };
                  }
                  return null;
                })
                .filter(point => point !== null) // Remove invalid points
            : []
        };
      });
      
      // Filter out trails with invalid coordinates
      const validTrails = trailsData.filter(trail => 
        trail.latitude !== null && 
        trail.longitude !== null && 
        !isNaN(trail.latitude) && 
        !isNaN(trail.longitude)
      );
      
      // If no trails found, add some sample data for testing
      if (validTrails.length === 0) {
        const sampleTrails = [
          {
            id: 'sample-1',
            name: 'Table Mountain Trail',
            difficulty: 'Moderate',
            distance: 5.2,
            elevationGain: 800,
            rating: 4.8,
            latitude: -33.9628,
            longitude: 18.4096,
            location: { latitude: -33.9628, longitude: 18.4096 },
            description: 'A challenging hike up Table Mountain with stunning views of Cape Town',
            tags: ['mountain', 'views', 'challenging'],
            photos: [],
            status: 'active',
            createdBy: 'sample',
            route: [[18.4096, -33.9628]],
            gpsRoute: [{ lng: 18.4096, lat: -33.9628 }]
          },
          {
            id: 'sample-2',
            name: 'Lion\'s Head Trail',
            difficulty: 'Easy',
            distance: 2.1,
            elevationGain: 200,
            rating: 4.5,
            latitude: -33.9356,
            longitude: 18.3881,
            location: { latitude: -33.9356, longitude: 18.3881 },
            description: 'Popular sunset hike with 360-degree views',
            tags: ['sunset', 'views', 'popular'],
            photos: [],
            status: 'active',
            createdBy: 'sample',
            route: [[18.3881, -33.9356]],
            gpsRoute: [{ lng: 18.3881, lat: -33.9356 }]
          }
        ];
        setTrails(sampleTrails);
      } else {
        setTrails(validTrails);
      }
    } catch (error) {
      console.error('Error fetching trails:', error);
      console.error('Error details:', error.message);
      setLocationError('Failed to load trails. Please try again.');
      setTrails([]); // Set empty array on error
    } finally {
      setIsLoadingTrails(false);
    }
  }, []);
  // Fetch trails on mount
  useEffect(() => {
    fetchTrails();
  }, [fetchTrails]);

  // Get user location
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
    // If showAll is true, return all trails without any filtering
    if (filters.showAll) {
      return trails;
    }

    return trails.filter(trail => {
      let withinDistance = true;
      
      // Get coordinates using the helper function
      const { latitude, longitude } = getTrailCoordinates(trail.location);
      
      // Use external user location if provided, otherwise use internal userLocation
      const currentUserLocation = externalUserLocation || userLocation;
      
      if (currentUserLocation && filters.maxLocationDistance > 0 && latitude && longitude) {
        const dist = calculateDistance(
          currentUserLocation.latitude,
          currentUserLocation.longitude,
          latitude,
          longitude
        );
        withinDistance = dist <= filters.maxLocationDistance;
      }

      const hasMatchingTag = filters.tags.length === 0 || 
        (trail.tags && filters.tags.every(filterTag => 
          trail.tags.some(trailTag => trailTag.toLowerCase() === filterTag.toLowerCase())
        ));

      const hasMatchingName = filters.searchQuery === '' ||
        trail.name.toLowerCase().includes(filters.searchQuery.toLowerCase());

      // Check if trail belongs to current user
      const isMyTrail = !filters.myTrails || !currentUserId || (() => {
        const createdByRaw = trail.createdBy;
        if (!createdByRaw) return false;
        const uid = typeof createdByRaw === 'string'
          ? (createdByRaw.includes('/') ? createdByRaw.split('/').pop() : createdByRaw)
          : createdByRaw;
        return uid === currentUserId;
      })();

      return (
        (filters.difficulty === 'all' || trail.difficulty === filters.difficulty) &&
        hasMatchingTag &&
        trail.distance >= filters.minDistance &&
        trail.distance <= filters.maxDistance &&
        withinDistance &&
        hasMatchingName &&
        isMyTrail
      );
    });
  }, [filters, userLocation, externalUserLocation, trails, currentUserId]);

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
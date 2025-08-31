// src/components/hooks/useTrails.js
import { useState, useMemo, useCallback } from 'react';

const sampleTrails = [
  {
    id: 1,
    name: "Melville Koppies Trail",
    difficulty: "Moderate",
    distance: 4.5,
    elevationGain: 600,
    rating: 4.8,
    gpsRoute: [
      { latitude: -26.1755, longitude: 27.9715 },
      { latitude: -26.1762, longitude: 27.9708 },
      { latitude: -26.1770, longitude: 27.9695 },
      { latitude: -26.1785, longitude: 27.9680 }
    ],
    location: { latitude: -26.1755, longitude: 27.9715 },
    description: "A popular trail on a rocky ridge with panoramic views of the city.",
    tags: ["rocky", "panoramic", "city-views"],
    photos: [],
    status: { status: "open", lastUpdated: new Date() },
    createdBy: "sample-user-1"
  },
  {
    id: 2,
    name: "Klipriviersberg Loop",
    difficulty: "Hard",
    distance: 8.9,
    elevationGain: 1100,
    rating: 4.6,
    gpsRoute: [
      { latitude: -26.2940, longitude: 28.0250 },
      { latitude: -26.2952, longitude: 28.0261 },
      { latitude: -26.2965, longitude: 28.0275 },
      { latitude: -26.2981, longitude: 28.0290 }
    ],
    location: { latitude: -26.2940, longitude: 28.0250 },
    description: "A challenging trail through the largest nature reserve in Johannesburg, home to diverse wildlife.",
    tags: ["bushveld", "wildlife", "nature-reserve"],
    photos: [],
    status: { status: "open", lastUpdated: new Date() },
    createdBy: "sample-user-2"
  },
  {
    id: 3,
    name: "Modderfontein Reserve Path",
    difficulty: "Easy",
    distance: 3.1,
    elevationGain: 200,
    rating: 4.5,
    gpsRoute: [
      { latitude: -26.0690, longitude: 28.1400 },
      { latitude: -26.0695, longitude: 28.1412 },
      { latitude: -26.0700, longitude: 28.1425 },
      { latitude: -26.0705, longitude: 28.1438 }
    ],
    location: { latitude: -26.0690, longitude: 28.1400 },
    description: "A gentle and flat trail through the reserve, perfect for a family walk.",
    tags: ["grassland", "family-friendly", "flat"],
    photos: [],
    status: { status: "open", lastUpdated: new Date() },
    createdBy: "sample-user-3"
  },
  {
    id: 4,
    name: "Walter Sisulu Waterfall Trail",
    difficulty: "Moderate",
    distance: 2.1,
    elevationGain: 450,
    rating: 4.9,
    gpsRoute: [
      { latitude: -26.1010, longitude: 27.8525 },
      { latitude: -26.1015, longitude: 27.8530 },
      { latitude: -26.1020, longitude: 27.8535 },
      { latitude: -26.1025, longitude: 27.8540 }
    ],
    location: { latitude: -26.1010, longitude: 27.8525 },
    description: "A scenic trail leading to the stunning Witpoortjie Waterfall.",
    tags: ["forest", "waterfall", "scenic"],
    photos: [],
    status: { status: "open", lastUpdated: new Date() },
    createdBy: "sample-user-4"
  },
  {
    id: 5,
    name: "The Wilds Nature Reserve",
    difficulty: "Easy",
    distance: 1.5,
    elevationGain: 150,
    rating: 4.7,
    gpsRoute: [
      { latitude: -26.1833, longitude: 28.0667 },
      { latitude: -26.1835, longitude: 28.0670 },
      { latitude: -26.1838, longitude: 28.0673 },
      { latitude: -26.1840, longitude: 28.0676 }
    ],
    location: { latitude: -26.1833, longitude: 28.0667 },
    description: "A serene urban reserve with walking paths and art installations.",
    tags: ["urban-park", "art", "serene"],
    photos: [],
    status: { status: "open", lastUpdated: new Date() },
    createdBy: "sample-user-5"
  },
  {
    id: 6,
    name: "Suikerbosrand Trail",
    difficulty: "Hard",
    distance: 10.3,
    elevationGain: 1500,
    rating: 4.7,
    gpsRoute: [
      { latitude: -26.4950, longitude: 28.1180 },
      { latitude: -26.4965, longitude: 28.1192 },
      { latitude: -26.4980, longitude: 28.1205 },
      { latitude: -26.4995, longitude: 28.1218 }
    ],
    location: { latitude: -26.4950, longitude: 28.1180 },
    description: "A demanding trail through the largest provincial nature reserve in Gauteng.",
    tags: ["mountain", "challenging", "provincial-reserve"],
    photos: [],
    status: { status: "open", lastUpdated: new Date() },
    createdBy: "sample-user-6"
  }
];

// Re-useable function to calculate distance
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

export default function useTrails() {
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tags: 'all',
    minDistance: 0,
    maxDistance: 20,
    maxLocationDistance: 80 // Updated default distance to kilometers
  });
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const getUserLocation = useCallback(() => {
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
  }, []);

  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  const filteredTrails = useMemo(() => {
    return sampleTrails.filter(trail => {
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
      
      const hasMatchingTag = filters.tags === 'all' || 
        trail.tags.some(tag => tag.toLowerCase().includes(filters.tags.toLowerCase()));
      
      return (
        (filters.difficulty === 'all' || trail.difficulty === filters.difficulty) &&
        hasMatchingTag &&
        trail.distance >= filters.minDistance &&
        trail.distance <= filters.maxDistance &&
        withinDistance
      );
    });
  }, [filters, userLocation]);

  return {
    filteredTrails,
    filters,
    handleFilterChange,
    userLocation,
    locationError,
    isLoadingLocation,
    getUserLocation,
    calculateDistance
  };
}
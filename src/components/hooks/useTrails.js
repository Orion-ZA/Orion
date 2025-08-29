// src/components/hooks/useTrails.js
import { useState, useMemo, useCallback } from 'react';

const sampleTrails = [
  {
    id: 1,
    name: "Melville Koppies Trail",
    difficulty: "moderate",
    length: 4.5,
    elevationGain: 600,
    rating: 4.8,
    coordinates: [
      [27.9715, -26.1755],
      [27.9708, -26.1762],
      [27.9695, -26.1770],
      [27.9680, -26.1785]
    ],
    longitude: 27.9715,
    latitude: -26.1755,
    description: "A popular trail on a rocky ridge with panoramic views of the city.",
    location: "Melville, Johannesburg",
    terrain: "rocky"
  },
  {
    id: 2,
    name: "Klipriviersberg Loop",
    difficulty: "hard",
    length: 8.9,
    elevationGain: 1100,
    rating: 4.6,
    coordinates: [
      [28.0250, -26.2940],
      [28.0261, -26.2952],
      [28.0275, -26.2965],
      [28.0290, -26.2981]
    ],
    longitude: 28.0250,
    latitude: -26.2940,
    description: "A challenging trail through the largest nature reserve in Johannesburg, home to diverse wildlife.",
    location: "Mondeor, Johannesburg",
    terrain: "bushveld"
  },
  {
    id: 3,
    name: "Modderfontein Reserve Path",
    difficulty: "easy",
    length: 3.1,
    elevationGain: 200,
    rating: 4.5,
    coordinates: [
      [28.1400, -26.0690],
      [28.1412, -26.0695],
      [28.1425, -26.0700],
      [28.1438, -26.0705]
    ],
    longitude: 28.1400,
    latitude: -26.0690,
    description: "A gentle and flat trail through the reserve, perfect for a family walk.",
    location: "Modderfontein, Johannesburg",
    terrain: "grassland"
  },
  {
    id: 4,
    name: "Walter Sisulu Waterfall Trail",
    difficulty: "moderate",
    length: 2.1,
    elevationGain: 450,
    rating: 4.9,
    coordinates: [
      [27.8525, -26.1010],
      [27.8530, -26.1015],
      [27.8535, -26.1020],
      [27.8540, -26.1025]
    ],
    longitude: 27.8525,
    latitude: -26.1010,
    description: "A scenic trail leading to the stunning Witpoortjie Waterfall.",
    location: "Roodepoort, Johannesburg",
    terrain: "forest"
  },
  {
    id: 5,
    name: "The Wilds Nature Reserve",
    difficulty: "easy",
    length: 1.5,
    elevationGain: 150,
    rating: 4.7,
    coordinates: [
      [28.0667, -26.1833],
      [28.0670, -26.1835],
      [28.0673, -26.1838],
      [28.0676, -26.1840]
    ],
    longitude: 28.0667,
    latitude: -26.1833,
    description: "A serene urban reserve with walking paths and art installations.",
    location: "Houghton, Johannesburg",
    terrain: "urban park"
  },
  {
    id: 6,
    name: "Suikerbosrand Trail",
    difficulty: "hard",
    length: 10.3,
    elevationGain: 1500,
    rating: 4.7,
    coordinates: [
      [28.1180, -26.4950],
      [28.1192, -26.4965],
      [28.1205, -26.4980],
      [28.1218, -26.4995]
    ],
    longitude: 28.1180,
    latitude: -26.4950,
    description: "A demanding trail through the largest provincial nature reserve in Gauteng.",
    location: "Heidelberg, Johannesburg",
    terrain: "mountain"
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
    location: 'all',
    terrain: 'all',
    minLength: 0,
    maxLength: 20,
    maxDistance: 80 // Updated default distance to kilometers
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
      if (userLocation && filters.maxDistance > 0) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          trail.latitude,
          trail.longitude
        );
        withinDistance = distance <= filters.maxDistance;
      }
      return (
        (filters.difficulty === 'all' || trail.difficulty === filters.difficulty) &&
        (filters.terrain === 'all' || trail.terrain === filters.terrain) &&
        trail.length >= filters.minLength &&
        trail.length <= filters.maxLength &&
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
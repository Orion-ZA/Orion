import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReverseGeocoding } from '../hooks/useReverseGeocoding';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [trailsData, setTrailsData] = useState([]);
  const navigate = useNavigate();
  const debounceTimeoutRef = useRef(null);
  const { reverseGeocode } = useReverseGeocoding();

  // Sample trail names and locations for suggestions
  // No static suggestions - only real trails and accurate Mapbox geocoding

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setShowSuggestions(false);
    
    // Navigate to trails page with search query for map zooming
    navigate('/trails', { 
      state: { searchQuery: query, action: 'zoom' },
      replace: false 
    });
  }, [navigate]);

  const getSuggestions = useCallback((query) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Get real trail names from trails data
    const realTrailNames = trailsData.map(trail => trail.name).filter(Boolean);

    // Filter real trail suggestions first (highest priority)
    // Enhanced matching: prioritize exact matches, then starts-with, then contains
    const realTrailMatches = trailsData.filter(trail =>
      trail.name && trail.name.toLowerCase().includes(query.toLowerCase())
    ).sort((a, b) => {
      const queryLower = query.toLowerCase();
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Exact match gets highest priority
      if (aName === queryLower && bName !== queryLower) return -1;
      if (bName === queryLower && aName !== queryLower) return 1;
      
      // Starts with query gets second priority
      if (aName.startsWith(queryLower) && !bName.startsWith(queryLower)) return -1;
      if (bName.startsWith(queryLower) && !aName.startsWith(queryLower)) return 1;
      
      // Then sort by length (shorter names first for better UX)
      return aName.length - bName.length;
    }).map(trail => {
      // Handle GeoPoint location field
      let coordinates = null;
      if (trail.location) {
        if (trail.location.latitude && trail.location.longitude) {
          coordinates = [trail.location.longitude, trail.location.latitude];
        } else if (trail.location._lat && trail.location._long) {
          coordinates = [trail.location._long, trail.location._lat];
        }
      }
      
      return {
        type: 'trail',
        name: trail.name,
        displayName: trail.name,
        description: trail.description || 'Trail in South Africa',
        difficulty: trail.difficulty || 'Unknown',
        distance: trail.distance ? `${trail.distance} km` : '',
        elevationGain: trail.elevationGain ? `${trail.elevationGain} m` : '',
        location: 'South Africa',
        tags: trail.tags || [],
        coordinates: coordinates,
        status: trail.status || 'open'
      };
    });

    // No static suggestions - only real trails and accurate geocoding

    // Only real trails from database
    const localFiltered = [...realTrailMatches];
    
    // Set local suggestions immediately if we have any
    // Show more trail suggestions immediately for better UX
    if (localFiltered.length > 0) {
      setSearchSuggestions(localFiltered.slice(0, 6)); // Show up to 6 trail suggestions immediately
    }

    // Debounce geocoding API call
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;
        let geocodingSuggestions = [];
        
        if (mapboxToken) {
          // Use Mapbox Geocoding API for accurate street-level suggestions
          const geocodingResponse = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&country=ZA&limit=5&types=address,poi,place,locality,neighborhood,region&bbox=16.4,-35.0,33.0,-22.0`
          );
          
          if (geocodingResponse.ok) {
            const geocodingResults = await geocodingResponse.json();
            geocodingSuggestions = geocodingResults.features?.map(feature => {
              const placeName = feature.place_name || '';
              const nameParts = placeName.split(', ');
              const displayName = nameParts.slice(0, 2).join(', ');
              
              // Determine if this is a trail-related location
              const isTrailRelated = feature.properties?.category?.toLowerCase().includes('trail') ||
                                   feature.properties?.category?.toLowerCase().includes('park') ||
                                   feature.properties?.category?.toLowerCase().includes('nature') ||
                                   feature.place_type?.includes('poi') ||
                                   feature.text?.toLowerCase().includes('trail') ||
                                   feature.text?.toLowerCase().includes('park') ||
                                   feature.text?.toLowerCase().includes('reserve');
              
              let description = 'Location in South Africa';
              let tags = ['Location'];
              
              if (isTrailRelated) {
                description = 'Trail or nature location';
                tags = ['Trail', 'Nature'];
              } else if (feature.place_type?.includes('address')) {
                description = 'Street address';
                tags = ['Address'];
              } else if (feature.place_type?.includes('poi')) {
                description = 'Point of interest';
                tags = ['POI'];
              }
              
              return {
                type: 'geocoded',
                name: feature.text || displayName,
                displayName: displayName,
                description: description,
                difficulty: '',
                distance: '',
                location: nameParts.slice(1, 3).join(', ') || 'South Africa',
                tags: tags,
                coordinates: feature.center ? [feature.center[0], feature.center[1]] : null
              };
            }) || [];
          }
        } else {
          // No Mapbox token available
        }

        // Prioritize: Real trails first, then accurate Mapbox geocoding
        // If we have many trail matches, limit geocoded suggestions to make room for trails
        const maxGeocodedSuggestions = realTrailMatches.length >= 5 ? 3 : 5;
        const limitedGeocodedSuggestions = geocodingSuggestions.slice(0, maxGeocodedSuggestions);
        
        const allSuggestions = [...realTrailMatches, ...limitedGeocodedSuggestions];
        
        // Remove duplicates based on displayName
        const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) => 
          index === self.findIndex(s => s.displayName === suggestion.displayName)
        );
        
        setSearchSuggestions(uniqueSuggestions.slice(0, 8));
      } catch (error) {
        // Keep local suggestions if geocoding fails
      }
    }, 300); // 300ms debounce
  }, [trailsData]);

  const getLocationCoordinates = useCallback(async (locationName) => {
    try {
      const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;
      
      if (!mapboxToken) {
        return null;
      }
      
      // Use Mapbox Geocoding API for accurate coordinates
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${mapboxToken}&country=ZA&limit=1&types=address,poi,place,locality,neighborhood,region&bbox=16.4,-35.0,33.0,-22.0`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          return {
            latitude: feature.center[1],
            longitude: feature.center[0],
            name: feature.place_name
          };
        }
      }
    } catch (error) {
      // Failed to get coordinates
    }
    return null;
  }, []);

  // Get location name from coordinates using reverse geocoding
  const getLocationNameFromCoordinates = useCallback(async (coordinates) => {
    try {
      const result = await reverseGeocode(coordinates);
      if (result) {
        return {
          name: result.name,
          fullAddress: result.fullAddress,
          city: result.city,
          type: result.type
        };
      }
    } catch (error) {
      // Failed to get location name
    }
    return null;
  }, [reverseGeocode]);

  const updateTrailsData = useCallback((trails) => {
    setTrailsData(trails || []);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchSuggestions([]);
    setShowSuggestions(false);
  }, []);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    searchQuery,
    setSearchQuery,
    searchSuggestions,
    setSearchSuggestions,
    showSuggestions,
    setShowSuggestions,
    handleSearch,
    getSuggestions,
    getLocationCoordinates,
    getLocationNameFromCoordinates,
    updateTrailsData,
    clearSearch
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

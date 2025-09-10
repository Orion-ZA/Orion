import { useState, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Adjust the path to your Firebase config

export const useGeocoding = (mapboxToken) => {
  const [geocodingLoading, setGeocodingLoading] = useState(false);

  // Function to geocode a search query to get trails and real-world locations
  const geocode = useCallback(async (query, limit = 5) => {
    if (!query.trim()) return [];
    
    setGeocodingLoading(true);
    try {
      // Fetch trails from Firestore
      const trailsCollection = collection(db, 'Trails');
      const trailsSnapshot = await getDocs(trailsCollection);
      const trailResults = trailsSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            address: '',
            city: '',
            state: '',
            country: 'South Africa',
            coordinates: {
              lat: data.location.latitude,
              lng: data.location.longitude
            },
            type: 'trail',
            relevance: data.name.toLowerCase().includes(query.toLowerCase()) ? 1 : 0,
            placeName: data.name
          };
        })
        .filter((trail) => trail.relevance > 0);

      // Fetch Mapbox geocoding results
      let mapboxResults = [];
      if (mapboxToken) {
        const encodedQuery = encodeURIComponent(query.trim());
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${mapboxToken}&types=place,poi,address,neighborhood,locality,postcode,region&limit=${limit}&country=ZA&proximity=28.0444,-26.1495`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch geocoding results');
        }
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          mapboxResults = data.features.map((feature) => {
            const context = feature.context || [];
            let city = '';
            let state = '';
            let country = '';
            
            // Extract location details from context
            context.forEach((item) => {
              if (item.id.startsWith('place.')) {
                city = item.text;
              } else if (item.id.startsWith('region.')) {
                state = item.text;
              } else if (item.id.startsWith('country.')) {
                country = item.text;
              }
            });
            
            // Determine the type of location
            let type = 'place';
            if (feature.place_type.includes('poi')) {
              type = 'poi';
            } else if (feature.place_type.includes('address')) {
              type = 'address';
            } else if (feature.place_type.includes('neighborhood')) {
              type = 'neighborhood';
            } else if (feature.place_type.includes('locality')) {
              type = 'locality';
            } else if (feature.place_type.includes('postcode')) {
              type = 'postcode';
            } else if (feature.place_type.includes('region')) {
              type = 'region';
            } else if (feature.place_type.includes('country')) {
              type = 'country';
            }
            
            return {
              id: feature.id,
              name: feature.text || feature.properties?.name || 'Unknown Location',
              address: feature.properties?.address || '',
              city: city || feature.properties?.city || '',
              state: state || feature.properties?.state || '',
              country: country || feature.properties?.country || 'South Africa',
              coordinates: {
                lat: feature.center[1],
                lng: feature.center[0]
              },
              type,
              relevance: feature.relevance || 0,
              placeName: feature.place_name || ''
            };
          });
        }
      }

      // Combine results, prioritizing trails
      const combinedResults = [
        ...trailResults.sort((a, b) => b.relevance - a.relevance),
        ...mapboxResults
      ].slice(0, limit);
      
      return combinedResults;
    } catch (error) {
      console.error('Error geocoding:', error);
      return [];
    } finally {
      setGeocodingLoading(false);
    }
  }, [mapboxToken]);

  return {
    geocodingLoading,
    geocode
  };
};
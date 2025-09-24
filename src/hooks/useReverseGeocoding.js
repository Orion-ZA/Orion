import { useState, useCallback } from 'react';

export const useReverseGeocoding = () => {
  const [reverseGeocodingLoading, setReverseGeocodingLoading] = useState(false);

  // Function to reverse geocode coordinates to get address using Mapbox API
  const reverseGeocode = useCallback(async (coordinates) => {
    setReverseGeocodingLoading(true);
    try {
      const [longitude, latitude] = coordinates;
      const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;
      
      if (!mapboxToken) {
        throw new Error('Mapbox token not found');
      }
      
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&types=address,poi,locality,neighborhood,place,region,country&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const context = feature.context || [];
        
        // Parse address components from Mapbox response
        let streetAddress = '';
        let houseNumber = '';
        let city = '';
        let state = '';
        let postcode = '';
        let country = '';
        let neighborhood = '';
        
        // Extract street address (usually the first part of place_name)
        const placeName = feature.place_name || '';
        const addressParts = placeName.split(',');
        if (addressParts.length > 0) {
          streetAddress = addressParts[0].trim();
        }
        
        // Extract components from context
        context.forEach((item) => {
          if (item.id.startsWith('address.')) {
            houseNumber = item.text;
          } else if (item.id.startsWith('neighborhood.')) {
            neighborhood = item.text;
          } else if (item.id.startsWith('locality.')) {
            city = item.text;
          } else if (item.id.startsWith('place.')) {
            if (!city) city = item.text;
          } else if (item.id.startsWith('region.')) {
            state = item.text;
          } else if (item.id.startsWith('postcode.')) {
            postcode = item.text;
          } else if (item.id.startsWith('country.')) {
            country = item.text;
          }
        });
        
        // If we don't have city from context, try to get it from place_name parts
        if (!city && addressParts.length > 0) {
          // If we only have one part, it's likely the city
          if (addressParts.length === 1) {
            city = addressParts[0].trim();
          } else {
            // Look for city in the place_name parts
            for (let i = 0; i < addressParts.length; i++) {
              const part = addressParts[i].trim();
              // Skip if it looks like a country (usually the last part and longer)
              if (i === addressParts.length - 1 && part.length > 10) {
                continue;
              }
              // Skip if it looks like a state/province (but not if it's a city name)
              if (part.includes('Province') || part.includes('State') || 
                  (part.includes('Cape') && part.includes('Province'))) {
                continue;
              }
              // This is likely the city
              city = part;
              break;
            }
          }
        }
        
        // Build full address
        // If streetAddress already contains the house number, don't duplicate it
        const addressPart = houseNumber && !streetAddress.includes(houseNumber) 
          ? `${houseNumber} ${streetAddress}` 
          : streetAddress;
        
        // Build full address, avoiding duplicates
        const fullAddressParts = [addressPart];
        if (neighborhood && neighborhood !== addressPart) fullAddressParts.push(neighborhood);
        if (city && city !== addressPart && city !== neighborhood) fullAddressParts.push(city);
        if (state && state !== city) fullAddressParts.push(state);
        if (postcode) fullAddressParts.push(postcode);
        if (country && country !== state) fullAddressParts.push(country);
        
        const fullAddress = fullAddressParts.join(', ');
        
        // Return the parsed address components
        return {
          address: streetAddress,
          houseNumber,
          city,
          state,
          postcode,
          country,
          neighborhood,
          fullAddress: fullAddress || placeName,
          displayName: placeName,
          name: feature.properties?.name || feature.text || streetAddress || city || 'Unknown Location',
          type: feature.place_type?.[0] || 'location',
          coordinates: feature.center || coordinates
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    } finally {
      setReverseGeocodingLoading(false);
    }
  }, []);

  return {
    reverseGeocodingLoading,
    reverseGeocode
  };
};

import { useState, useEffect } from 'react';
import { fetchTrailReviews, fetchWeatherData } from '../utils/trailApi';
import { useTrailAlerts } from './useTrailAlerts';

export const useTrailContent = (trail) => {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewSortBy, setReviewSortBy] = useState('newest');
  
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Use the existing trail alerts hook
  const { 
    trailAlerts, 
    loadingStates: alertLoadingStates, 
    fetchTrailAlerts 
  } = useTrailAlerts();

  // Fetch reviews
  const fetchReviews = async () => {
    if (!trail?.id) return;
    
    setLoadingReviews(true);
    try {
      const reviewsData = await fetchTrailReviews(trail.id);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Fetch weather data
  const fetchWeather = async () => {
    if (!trail?.location) return;
    
    setLoadingWeather(true);
    try {
      let latitude, longitude;
      
      if (typeof trail.location === 'object' && trail.location !== null) {
        if (trail.location.latitude && trail.location.longitude) {
          latitude = trail.location.latitude;
          longitude = trail.location.longitude;
        } else if (trail.location._latitude && trail.location._longitude) {
          latitude = trail.location._latitude;
          longitude = trail.location._longitude;
        } else {
          console.warn('Invalid location data for weather');
          setLoadingWeather(false);
          return;
        }
      } else {
        console.warn('No location data available for weather');
        setLoadingWeather(false);
        return;
      }

      const weatherData = await fetchWeatherData(latitude, longitude);
      setWeatherData(weatherData);
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeatherData(null);
    } finally {
      setLoadingWeather(false);
    }
  };

  // Sort reviews
  const getSortedReviews = () => {
    if (!reviews || reviews.length === 0) return [];
    
    const sortedReviews = [...reviews].sort((a, b) => {
      switch (reviewSortBy) {
        case 'newest':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'highest':
          return (b.rating || 0) - (a.rating || 0);
        case 'lowest':
          return (a.rating || 0) - (b.rating || 0);
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });
    
    return sortedReviews;
  };

  // Effects for fetching data when trail changes
  useEffect(() => {
    if (trail?.id) {
      fetchReviews();
      fetchTrailAlerts(trail.id);
    }
  }, [trail?.id]);

  useEffect(() => {
    if (trail?.location) {
      fetchWeather();
    }
  }, [trail?.location]);

  return {
    reviews,
    setReviews,
    loadingReviews,
    reviewSortBy,
    setReviewSortBy,
    getSortedReviews,
    weatherData,
    loadingWeather,
    fetchReviews,
    // Alerts data
    alerts: trailAlerts[trail?.id] || [],
    loadingAlerts: alertLoadingStates[trail?.id] || false
  };
};

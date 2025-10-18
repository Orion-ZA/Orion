import { useState } from 'react';
import { useTrailData } from './useTrailData';
import { useTrailUserActions } from './useTrailUserActions';
import { useTrailModals } from './useTrailModals';
import { useTrailContent } from './useTrailContent';
import { useToast } from '../components/ToastContext';
import { createTrailNavigationActions } from '../utils/trailNavigation';

export const useTrailDetail = () => {
  const { show: showToast } = useToast();

  // Core trail data
  const { trail, loading, error, authorName, setTrail } = useTrailData();
  
  // User actions
  const { user, userSaved, handleTrailAction } = useTrailUserActions();
  
  // Content (reviews, weather, alerts)
  const { 
    reviews, 
    setReviews, 
    loadingReviews, 
    reviewSortBy, 
    setReviewSortBy, 
    getSortedReviews,
    weatherData, 
    loadingWeather,
    fetchReviews,
    alerts,
    loadingAlerts
  } = useTrailContent(trail);
  
  // Modals
  const modalActions = useTrailModals(user, trail?.id, trail?.name, setTrail, fetchReviews);
  
  // Navigation actions
  const { handleShare, handleDirections, handleShowOnMap } = createTrailNavigationActions(null, showToast);
  
  // UI state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('reviews');

  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  return {
    // Trail data
    trail,
    loading,
    error,
    authorName,
    
    // User data
    user,
    userSaved,
    
    // Reviews data
    reviews,
    loadingReviews,
    reviewSortBy,
    setReviewSortBy,
    getSortedReviews,
    
    // Weather data
    weatherData,
    loadingWeather,
    
    // Alerts data
    alerts,
    loadingAlerts,
    
    // UI state
    currentImageIndex,
    setCurrentImageIndex,
    activeTab,
    setActiveTab,
    
    // Actions
    handleTrailAction,
    handleShare: () => handleShare(trail?.name),
    handleDirections: () => handleDirections(trail),
    handleShowOnMap: (navigate) => handleShowOnMap(trail, navigate),
    goToImage,
    
    // Modal actions
    ...modalActions
  };
};

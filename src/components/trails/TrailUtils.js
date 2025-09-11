import { Footprints, Mountain, AlertTriangle, Zap } from 'lucide-react';

// Function to get difficulty color
export const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return '#4CAF50'; // Green
    case 'moderate':
      return '#FF9800'; // Orange
    case 'hard':
    case 'difficult':
      return '#F44336'; // Red
    case 'expert':
      return '#9C27B0'; // Purple
    default:
      return '#2196F3'; // Blue (default)
  }
};

// Function to get difficulty icon
export const getDifficultyIcon = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return <Footprints size={12} />;
    case 'moderate':
      return <Mountain size={12} />;
    case 'hard':
    case 'difficult':
      return <AlertTriangle size={12} />;
    case 'expert':
      return <Zap size={12} />;
    default:
      return <Footprints size={12} />;
  }
};

// Calculate distance between two coordinates
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate total distance of a route (array of coordinates)
export const calculateRouteDistance = (routePoints) => {
  if (routePoints.length < 2) return 0;
  
  let totalDistance = 0;
  for (let i = 1; i < routePoints.length; i++) {
    const [lng1, lat1] = routePoints[i - 1];
    const [lng2, lat2] = routePoints[i];
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    totalDistance += R * c;
  }
  
  return totalDistance;
};

// Format file size with appropriate unit
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const size = bytes / Math.pow(k, i);
  
  // Show different decimal places based on size
  if (i === 0) return `${bytes} ${sizes[i]}`; // Bytes - no decimals
  if (i === 1) return `${size.toFixed(1)} ${sizes[i]}`; // KB - 1 decimal
  if (i === 2) return `${size.toFixed(2)} ${sizes[i]}`; // MB - 2 decimals
  return `${size.toFixed(2)} ${sizes[i]}`; // GB - 2 decimals
};
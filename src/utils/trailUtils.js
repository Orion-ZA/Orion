// Utility functions for TrailsManagement
import { Star } from 'lucide-react';

export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  let date;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    // Firestore Timestamp
    date = timestamp.toDate();
  } else if (typeof timestamp === 'string') {
    // String timestamp
    date = new Date(timestamp);
  } else {
    // Other formats
    date = new Date(timestamp);
  }
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleDateString();
};

export const formatLocation = (location) => {
  if (!location) return 'N/A';
  
  // Handle different location formats
  if (typeof location === 'object') {
    // If it's a Firestore GeoPoint or similar object
    if (location.latitude !== undefined && location.longitude !== undefined) {
      return `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`;
    }
    // If it's a string representation of coordinates
    if (location.lat !== undefined && location.lng !== undefined) {
      return `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}`;
    }
    // If it's an object with coordinates array
    if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
      return `${location.coordinates[1]?.toFixed(4)}, ${location.coordinates[0]?.toFixed(4)}`;
    }
    // If it's an object but we can't parse it, return a string representation
    return String(location);
  }
  
  // If it's already a string, return it
  if (typeof location === 'string') {
    return location;
  }
  
  return 'N/A';
};

export const getAlertTypeColor = (type) => {
  const colors = {
    'hazard': '#ef4444',
    'closure': '#f59e0b',
    'maintenance': '#3b82f6',
    'weather': '#8b5cf6',
    'general': '#6b7280'
  };
  return colors[type?.toLowerCase()] || '#6b7280';
};

export const getAlertTypeIcon = (type) => {
  const icons = {
    'hazard': 'AlertTriangle',
    'closure': 'XCircle',
    'maintenance': 'Wrench',
    'weather': 'CloudRain',
    'general': 'Info'
  };
  return icons[type?.toLowerCase()] || 'Info';
};

export const renderStars = (rating) => {
  // Ensure rating is a number
  const numericRating = typeof rating === 'number' ? rating : 0;
  
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`trail-card-star ${i < numericRating ? 'filled' : 'empty'}`}
      size={16}
    />
  ));
};

export const getDifficultyColor = (difficulty) => {
  const colors = {
    'easy': '#34c759',
    'moderate': '#ffc107', 
    'hard': '#ff6b6b',
    'Easy': '#34c759',
    'Moderate': '#ffc107',
    'Hard': '#ff6b6b'
  };
  return colors[difficulty] || '#a0a0a0';
};

export const truncateUserId = (userId, maxLength = 12) => {
  if (!userId || typeof userId !== 'string') return 'Unknown';
  
  if (userId.length <= maxLength) return userId;
  
  // Show first 6 and last 6 characters for Firebase UIDs
  if (userId.length > 20) {
    return `${userId.substring(0, 6)}...${userId.substring(userId.length - 6)}`;
  }
  
  // For shorter IDs, just truncate with ellipsis
  return `${userId.substring(0, maxLength - 3)}...`;
};

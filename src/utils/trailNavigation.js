import { useToast } from '../components/ToastContext';

export const createTrailNavigationActions = (navigate, showToast) => {
  const handleShare = async trailName => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trailName || 'Trail Details',
          text: `Check out this trail: ${trailName}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', { type: 'success', position: 'share-button' });
    }
  };

  const handleDirections = trail => {
    if (!trail?.location) {
      showToast('Location not available for this trail', 'error');
      return;
    }

    let latitude, longitude;

    if (typeof trail.location === 'object' && trail.location !== null) {
      if (trail.location.latitude && trail.location.longitude) {
        latitude = trail.location.latitude;
        longitude = trail.location.longitude;
      } else if (trail.location._latitude && trail.location._longitude) {
        latitude = trail.location._latitude;
        longitude = trail.location._longitude;
      } else {
        showToast('Invalid location data', 'error');
        return;
      }
    } else {
      showToast('Location not available for this trail', 'error');
      return;
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleShowOnMap = (trail, navigate) => {
    if (!trail?.location) {
      showToast('Location not available for this trail', 'error');
      return;
    }

    let latitude, longitude;

    if (typeof trail.location === 'object' && trail.location !== null) {
      if (trail.location.latitude && trail.location.longitude) {
        latitude = trail.location.latitude;
        longitude = trail.location.longitude;
      } else if (trail.location._latitude && trail.location._longitude) {
        latitude = trail.location._latitude;
        longitude = trail.location._longitude;
      } else {
        showToast('Invalid location data', 'error');
        return;
      }
    } else {
      showToast('Location not available for this trail', 'error');
      return;
    }

    const cleanTrail = {
      id: trail.id,
      name: trail.name,
      description: trail.description,
      latitude: latitude,
      longitude: longitude,
      distance: trail.distance,
      difficulty: trail.difficulty,
      elevationGain: trail.elevationGain,
      status: trail.status,
      createdAt: trail.createdAt,
      lastUpdated: trail.lastUpdated,
      tags: trail.tags,
      photos: trail.photos,
      gpsRoute: trail.gpsRoute,
      location: trail.location,
    };

    navigate('/trails', {
      state: {
        trailToCenter: cleanTrail,
        action: 'centerTrail',
      },
    });
  };

  return {
    handleShare,
    handleDirections,
    handleShowOnMap,
  };
};

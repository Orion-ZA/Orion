import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ArrowLeft, Share2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import './TrailDetail.css';

// Import new components
import TrailImageGallery from '../components/trails/TrailImageGallery';
import TrailInfo from '../components/trails/TrailInfo';
import WeatherSection from '../components/trails/WeatherSection';
import UserActions from '../components/trails/UserActions';
import TabSection from '../components/trails/TabSection';
import ContributionModal from '../components/trails/ContributionModal';

const TrailDetail = () => {
  const { trailId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [trail, setTrail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [weatherData, setWeatherData] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [reviewSortBy, setReviewSortBy] = useState('newest'); // newest, oldest, highest, lowest
  const [activeTab, setActiveTab] = useState('reviews'); // reviews, media, alerts
  const [user, setUser] = useState(null);
  const [userSaved, setUserSaved] = useState({ favourites: [], wishlist: [], completed: [] });
  const [authorName, setAuthorName] = useState('Unknown');
  const { show: showToast } = useToast();

  // Contribution states
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [contributionType, setContributionType] = useState(''); // 'review', 'image', 'alert'
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [newImages, setNewImages] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('general');
  const [uploading, setUploading] = useState(false);

  // Sort reviews based on selected criteria
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

  // Estimate duration based on distance
  const estimateDuration = (distance) => {
    if (!distance || distance <= 0) return 'Not specified';
    
    // Average hiking speed: 3-4 km/h
    // Add extra time for elevation gain, difficulty, breaks
    const baseHours = distance / 3.5; // Use 3.5 km/h as average
    const minHours = baseHours * 0.8; // 20% faster
    const maxHours = baseHours * 1.4; // 40% slower for breaks, elevation, etc.
    
    // Ensure min is always less than max
    const finalMinHours = Math.min(minHours, maxHours - 0.1);
    const finalMaxHours = Math.max(maxHours, minHours + 0.1);
    
    const formatTime = (hours) => {
      if (hours < 1) {
        return `${Math.round(hours * 60)} min`;
      } else if (hours < 2) {
        const minutes = Math.round((hours - Math.floor(hours)) * 60);
        return minutes > 0 ? `${Math.floor(hours)}h ${minutes}m` : `${Math.floor(hours)}h`;
      } else {
        const minutes = Math.round((hours - Math.floor(hours)) * 60);
        return minutes > 0 ? `${Math.floor(hours)}h ${minutes}m` : `${Math.floor(hours)}h`;
      }
    };
    
    const minTime = formatTime(finalMinHours);
    const maxTime = formatTime(finalMaxHours);
    
    return `${minTime} - ${maxTime}`;
  };

  // Get trail data from location state or fetch from Firestore
  useEffect(() => {
    const fetchTrailData = async () => {
      try {
        setLoading(true);
        
        // First check if trail data was passed via navigation state
        if (location.state?.trail) {
          setTrail(location.state.trail);
          setLoading(false);
          return;
        }

        // If no trail data in state, fetch from Firestore
        if (trailId) {
          const trailDoc = await getDoc(doc(db, 'Trails', trailId));
          if (trailDoc.exists()) {
            const trailData = { id: trailDoc.id, ...trailDoc.data() };
            setTrail(trailData);
          } else {
            setError('Trail not found');
          }
        } else {
          setError('Invalid trail ID');
        }
      } catch (err) {
        console.error('Error fetching trail:', err);
        setError('Failed to load trail');
      } finally {
        setLoading(false);
      }
    };

    fetchTrailData();
  }, [trailId, location.state]);

  // Fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      if (user) {
        setUser(user);
        try {
          const userDoc = await getDoc(doc(db, 'Users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Extract trail IDs from document references
            const extractTrailIds = (array) => {
              if (!Array.isArray(array)) return [];
              return array.map(item => {
                if (typeof item === 'string') return item;
                if (item && item.id) return item.id;
                if (item && item._key && item._key.path) {
                  // Extract ID from Firestore document reference path
                  const pathParts = item._key.path.segments;
                  return pathParts[pathParts.length - 1];
                }
                // Handle other possible reference formats
                if (item && typeof item === 'object' && item.path) {
                  const pathParts = item.path.split('/');
                  return pathParts[pathParts.length - 1];
                }
                console.warn('Unknown item format in user saved array:', item);
                return null;
              }).filter(Boolean);
            };
            
            const processedUserSaved = {
              favourites: extractTrailIds(userData.favourites),
              wishlist: extractTrailIds(userData.wishlist),
              completed: extractTrailIds(userData.completed)
            };
            
            setUserSaved(processedUserSaved);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setUserSaved({ favourites: [], wishlist: [], completed: [] });
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch reviews
  useEffect(() => {
    if (trail?.id) {
      fetchTrailReviews();
    }
  }, [trail?.id]);

  // Fetch weather data
  useEffect(() => {
    if (trail?.location) {
      fetchWeatherData();
    }
  }, [trail?.location]);

  // Fetch author name
  useEffect(() => {
    const fetchAuthorName = async () => {
      if (!trail?.createdBy) {
        setAuthorName('Unknown');
        return;
      }

      try {
        const createdByRaw = trail.createdBy;
        console.log('Raw createdBy:', createdByRaw, 'Type:', typeof createdByRaw);
        
        let uid;
        if (typeof createdByRaw === 'string') {
          uid = createdByRaw.includes('/') ? createdByRaw.split('/').pop() : createdByRaw;
        } else if (createdByRaw && typeof createdByRaw === 'object') {
          // Handle Firestore document reference
          if (createdByRaw.id) {
            uid = createdByRaw.id;
          } else if (createdByRaw._key && createdByRaw._key.path) {
            const pathParts = createdByRaw._key.path.segments;
            uid = pathParts[pathParts.length - 1];
          } else if (createdByRaw._path && createdByRaw._path.segments) {
            // Handle Firestore document reference with _path.segments
            const pathParts = createdByRaw._path.segments;
            uid = pathParts[pathParts.length - 1];
          } else {
            console.warn('Unknown createdBy object format:', createdByRaw);
            setAuthorName('Unknown');
            return;
          }
        } else {
          uid = createdByRaw;
        }

        console.log('Extracted UID:', uid, 'Type:', typeof uid);

        if (!uid || uid === 'sample' || uid === 'unknown' || typeof uid !== 'string') {
          setAuthorName(uid === 'sample' ? 'Sample User' : 'Unknown');
          return;
        }

        const userDoc = await getDoc(doc(db, 'Users', uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setAuthorName(userData.profileInfo?.displayName || userData.displayName || userData.name || 'Unknown');
        } else {
          setAuthorName('Unknown');
        }
      } catch (error) {
        console.error('Error fetching author name:', error);
        setAuthorName('Unknown');
      }
    };

    fetchAuthorName();
  }, [trail?.createdBy]);

  const fetchTrailReviews = async () => {
    if (!trail?.id) return;
    
    setLoadingReviews(true);
    try {
      // Use the same Cloud Function approach as ReviewsMedia page
      const response = await fetch(
        `https://us-central1-orion-sdp.cloudfunctions.net/getTrailReviews?trailId=${trail.id}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const reviewsData = data.reviews || [];
        setReviews(reviewsData);
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchWeatherData = async () => {
    if (!trail?.location) return;
    
    setLoadingWeather(true);
    try {
      // Extract coordinates from trail location
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

      // You need to replace this with your actual OpenWeatherMap API key
      // Option 1: Replace the string below with your API key
      // Option 2: Create a .env file in your project root with: REACT_APP_OPENWEATHER_API_KEY=your_api_key_here
      const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY || '824bc28d7c314a9f031ecbe01823dbb8';
      
      // Fetch weather forecast
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
      );
      
      if (response.ok) {
        const data = await response.json();
        const processedData = processWeatherData(data);
        setWeatherData(processedData);
      } else {
        // Fallback: Try current weather if forecast fails
        const currentResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );
        
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          const fallbackData = [{
            date: new Date().toDateString(),
            minTemp: Math.round(currentData.main.temp_min),
            maxTemp: Math.round(currentData.main.temp_max),
            condition: currentData.weather[0].main,
            humidity: currentData.main.humidity,
            windSpeed: Math.round(currentData.wind.speed)
          }];
          setWeatherData(fallbackData);
        } else {
          setWeatherData(null);
        }
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setWeatherData(null);
    } finally {
      setLoadingWeather(false);
    }
  };


  const processWeatherData = (data) => {
    const dailyForecasts = {};
    
    data.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toDateString();
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date,
          temps: [],
          conditions: [],
          humidity: [],
          windSpeed: []
        };
      }
      
      dailyForecasts[date].temps.push(item.main.temp);
      dailyForecasts[date].conditions.push(item.weather[0].main);
      dailyForecasts[date].humidity.push(item.main.humidity);
      dailyForecasts[date].windSpeed.push(item.wind.speed);
    });

    const processedDays = Object.values(dailyForecasts).slice(0, 7).map(day => ({
      date: day.date,
      minTemp: Math.min(...day.temps),
      maxTemp: Math.max(...day.temps),
      condition: day.conditions[0], // Use first condition of the day
      humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
      windSpeed: Math.round(day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length)
    }));

    return processedDays;
  };

  const handleTrailAction = async (action, trailId) => {
    if (!user) {
      showToast('Please log in to save trails', 'error');
      return;
    }

    try {
      const userRef = doc(db, 'Users', user.uid);
      const currentArray = userSaved[action] || [];
      const isInArray = currentArray.includes(trailId);
      
      if (isInArray) {
        // Remove from array - use document reference for consistency
        const trailRef = doc(db, 'Trails', trailId);
        await updateDoc(userRef, {
          [action]: arrayRemove(trailRef)
        });
        setUserSaved(prev => ({
          ...prev,
          [action]: prev[action].filter(id => id !== trailId)
        }));
        showToast(`Removed from ${action}`, 'success');
      } else {
        // Add to array - use document reference for consistency
        const trailRef = doc(db, 'Trails', trailId);
        await updateDoc(userRef, {
          [action]: arrayUnion(trailRef)
        });
        setUserSaved(prev => ({
          ...prev,
          [action]: [...prev[action], trailId]
        }));
        showToast(`Added to ${action}`, 'success');
      }
    } catch (error) {
      console.error(`Error updating ${action}:`, error);
      showToast(`Failed to update ${action}`, 'error');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trail?.name || 'Trail Details',
          text: `Check out this trail: ${trail?.name}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  const handleDirections = () => {
    if (!trail?.location) {
      showToast('Location not available for this trail', 'error');
      return;
    }

    let latitude, longitude;
    
    // Handle different location formats
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

    // Open Google Maps with the trail location
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(googleMapsUrl, '_blank');
  };

  // Contribution functions
  const openContributionModal = (type) => {
    if (!user) {
      showToast('Please log in to contribute', 'error');
      return;
    }
    setContributionType(type);
    setShowContributionModal(true);
  };

  const closeContributionModal = () => {
    setShowContributionModal(false);
    setContributionType('');
    setNewReview('');
    setNewRating(5);
    setIsAnonymous(false);
    setNewImages([]);
    setAlertMessage('');
    setAlertType('general');
    setUploading(false);
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setNewImages(files);
    }
  };

  const uploadPhotos = async (images) => {
    const uploadPromises = images.map(async (image) => {
      const imageRef = ref(storage, `trail-images/${trailId}/${uuidv4()}`);
      await uploadBytes(imageRef, image);
      return await getDownloadURL(imageRef);
    });
    return Promise.all(uploadPromises);
  };

  const handleAddReview = async () => {
    if (!newReview.trim()) {
      showToast('Please enter a review', 'error');
      return;
    }

    setUploading(true);
    try {
      const userDisplayName = isAnonymous ? "Anonymous" : (user.displayName || user.email || "User");
      
      const response = await fetch(
        "https://us-central1-orion-sdp.cloudfunctions.net/addTrailReview",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trailId: trailId,
            review: {
              id: uuidv4(),
              comment: newReview,
              rating: newRating,
              timestamp: new Date().toISOString(),
              userId: user.uid,
              userName: userDisplayName,
              userEmail: user.email
            }
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Server returned ${response.status}`);

      // Refetch reviews
      await fetchTrailReviews();
      closeContributionModal();
      showToast('Your review has been submitted successfully!', 'success');
    } catch (err) {
      console.error('Failed to add review:', err);
      showToast('Failed to add review: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAddImages = async () => {
    if (!newImages.length) {
      showToast('Please select images to upload', 'error');
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls = await uploadPhotos(newImages);

      const response = await fetch(
        "https://us-central1-orion-sdp.cloudfunctions.net/updateTrailImages",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trailId: trailId,
            photos: uploadedUrls
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to update trail images');

      // Update local trail data
      setTrail(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...uploadedUrls]
      }));

      closeContributionModal();
      showToast('Images uploaded successfully!', 'success');
    } catch (err) {
      console.error('Failed to upload images:', err);
      showToast('Failed to upload images: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAddAlert = async () => {
    if (!alertMessage.trim()) {
      showToast('Please enter an alert message', 'error');
      return;
    }

    setUploading(true);
    try {
      await fetch("https://us-central1-orion-sdp.cloudfunctions.net/addAlert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trailId: trailId,
          message: alertMessage,
          type: alertType,
        }),
      });

      closeContributionModal();
      showToast('Your alert has been submitted successfully!', 'success');
    } catch (err) {
      console.error('Failed to add alert:', err);
      showToast('Failed to add alert: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };


  const goToImage = (index) => {
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <div className="trail-detail-page">
        <div className="trail-detail-loading">
          <div className="loading-spinner"></div>
          <p>Loading trail details...</p>
        </div>
      </div>
    );
  }

  if (error || !trail) {
    return (
      <div className="trail-detail-page">
        <div className="trail-detail-error">
          <h2>Trail Not Found</h2>
          <p>{error || 'The trail you\'re looking for doesn\'t exist.'}</p>
          <button onClick={() => navigate('/trails')} className="btn-primary">
            <ArrowLeft size={16} />
            Back to Trails
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trail-detail-page">
      {/* Header */}
      <div className="trail-detail-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
          Back
        </button>
        
        <div className="header-actions">
          <button onClick={handleShare} className="share-button">
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="trail-detail-content">
        {/* Image Gallery */}
        <TrailImageGallery 
          images={trail.images}
          currentImageIndex={currentImageIndex}
          onImageChange={setCurrentImageIndex}
          onGoToImage={goToImage}
        />

        {/* Trail Info */}
        <TrailInfo 
          trail={trail}
          authorName={authorName}
          onDirections={handleDirections}
          estimateDuration={estimateDuration}
        />

          {/* Weather Forecast */}
          <WeatherSection 
            weatherData={weatherData}
            loadingWeather={loadingWeather}
          />

          {/* User Actions */}
          <UserActions 
            user={user}
            trail={trail}
            userSaved={userSaved}
            onTrailAction={handleTrailAction}
          />

          {/* Tab Section */}
          <TabSection 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            reviews={reviews}
            trail={trail}
            reviewSortBy={reviewSortBy}
            setReviewSortBy={setReviewSortBy}
            loadingReviews={loadingReviews}
            getSortedReviews={getSortedReviews}
            onOpenContributionModal={openContributionModal}
            currentImageIndex={currentImageIndex}
            setCurrentImageIndex={setCurrentImageIndex}
          />
        </div>

        {/* Contribution Modal */}
        <ContributionModal 
        showContributionModal={showContributionModal}
        contributionType={contributionType}
        newReview={newReview}
        setNewReview={setNewReview}
        newRating={newRating}
        setNewRating={setNewRating}
        isAnonymous={isAnonymous}
        setIsAnonymous={setIsAnonymous}
        newImages={newImages}
        alertMessage={alertMessage}
        setAlertMessage={setAlertMessage}
        alertType={alertType}
        setAlertType={setAlertType}
        uploading={uploading}
        onCloseContributionModal={closeContributionModal}
        onAddReview={handleAddReview}
        onAddImages={handleAddImages}
        onAddAlert={handleAddAlert}
        onImageUpload={handleImageUpload}
      />
    </div>
  );
};

export default TrailDetail;

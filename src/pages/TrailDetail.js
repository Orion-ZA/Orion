import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Heart, Bookmark, Check, Edit3, MapPin, ArrowLeft, Share2, Calendar, Clock, TrendingUp, Users, Star, ChevronLeft, ChevronRight, MessageSquare, Image, Bell, Plus, Upload, AlertTriangle, Navigation, Sun, Cloud, CloudRain, CloudSnow, Wind, Droplets } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import './TrailDetail.css';

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

  const getWeatherIcon = (condition) => {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return <Sun size={24} className="weather-icon sun" />;
    } else if (conditionLower.includes('cloud')) {
      return <Cloud size={24} className="weather-icon cloud" />;
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return <CloudRain size={24} className="weather-icon rain" />;
    } else if (conditionLower.includes('snow') || conditionLower.includes('sleet')) {
      return <CloudSnow size={24} className="weather-icon snow" />;
    } else if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
      return <CloudRain size={24} className="weather-icon storm" />;
    } else {
      return <Cloud size={24} className="weather-icon default" />;
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

  const nextImage = () => {
    if (trail?.images && trail.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % trail.images.length);
    }
  };

  const prevImage = () => {
    if (trail?.images && trail.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + trail.images.length) % trail.images.length);
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
        {trail.images && trail.images.length > 0 && (
          <div className="trail-detail-image-gallery">
            <div className="trail-detail-main-image">
              <img 
                src={trail.images[currentImageIndex]} 
                alt={`${trail.name} - Image ${currentImageIndex + 1}`}
              />
              
              {trail.images.length > 1 && (
                <>
                  <button 
                    className="trail-detail-image-nav-btn prev" 
                    onClick={prevImage}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    className="trail-detail-image-nav-btn next" 
                    onClick={nextImage}
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                  
                  <div className="trail-detail-image-counter">
                    {currentImageIndex + 1} / {trail.images.length}
                  </div>
                </>
              )}
            </div>

            {trail.images.length > 1 && (
              <div className="trail-detail-thumbnails">
                {trail.images.map((image, index) => (
                  <div
                    key={index}
                    className={`trail-detail-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => goToImage(index)}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trail Info */}
        <div className="trail-detail-info">
          <div className="trail-detail-title-section">
            <h1 className="trail-detail-title">{trail.name}</h1>
            <div className="trail-detail-location">
              <button
                className="trail-detail-directions-btn"
                onClick={handleDirections}
                title="Get directions to this trail"
              >
                <Navigation size={16} />
                Get Directions
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="trail-detail-details-grid">
            <div className="trail-detail-detail-card">
              <div className="trail-detail-detail-icon">
                <TrendingUp size={20} />
              </div>
              <div className="trail-detail-detail-info">
                <div className="trail-detail-detail-label">Difficulty</div>
                <div className="trail-detail-detail-value">{trail.difficulty}</div>
              </div>
            </div>

            <div className="trail-detail-detail-card">
              <div className="trail-detail-detail-icon">
                <Clock size={20} />
              </div>
              <div className="trail-detail-detail-info">
                <div className="trail-detail-detail-label">Duration</div>
                <div className="trail-detail-detail-value">{estimateDuration(trail.distance)}</div>
              </div>
            </div>

            <div className="trail-detail-detail-card">
              <div className="trail-detail-detail-icon">
                <TrendingUp size={20} />
              </div>
              <div className="trail-detail-detail-info">
                <div className="trail-detail-detail-label">Distance</div>
                <div className="trail-detail-detail-value">{trail.distance} km</div>
              </div>
            </div>

            <div className="trail-detail-detail-card">
              <div className="trail-detail-detail-icon">
                <Users size={20} />
              </div>
              <div className="trail-detail-detail-info">
                <div className="trail-detail-detail-label">Author</div>
                <div className="trail-detail-detail-value">{authorName}</div>
              </div>
            </div>

            {trail.elevationGain && trail.elevationGain > 0 && (
              <div className="trail-detail-detail-card">
                <div className="trail-detail-detail-icon">
                  <TrendingUp size={20} />
                </div>
                <div className="trail-detail-detail-info">
                  <div className="trail-detail-detail-label">Elevation Gain</div>
                  <div className="trail-detail-detail-value">{trail.elevationGain} m</div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {trail.description && (
            <div className="trail-detail-description">
              <h3>Description</h3>
              <p>{trail.description}</p>
            </div>
          )}

          {/* Tags */}
          {trail.tags && trail.tags.length > 0 && (
            <div className="trail-detail-tags">
              <h3>Tags</h3>
              <div className="trail-detail-tag-list">
                {trail.tags.map((tag, index) => (
                  <span key={index} className="trail-detail-tag">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Route Information */}
          {trail.route && trail.route.length > 0 && (
            <div className="trail-detail-route">
              <h3>Route Information</h3>
              <div className="trail-detail-route-info">
                <p><strong>Route Points:</strong> {trail.route.length} waypoints</p>
                <p><strong>Route Type:</strong> {trail.routeType || 'Custom'}</p>
              </div>
            </div>
          )}

          {/* Weather Forecast */}
          <div className="trail-detail-weather-section">
            <h3>Weather Forecast</h3>
            {loadingWeather ? (
              <div className="trail-detail-loading">
                <div className="trail-detail-loading-spinner"></div>
                Loading weather data...
              </div>
            ) : weatherData && weatherData.length > 0 ? (
             <div className="trail-detail-weather-forecast">
               {weatherData.map((day, index) => (
                 <div key={index} className="trail-detail-weather-day">
                   <div className="trail-detail-weather-header">
                     <div className="trail-detail-weather-date">
                       {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                     </div>
                     <div className="trail-detail-weather-icon">
                       {getWeatherIcon(day.condition)}
                     </div>
                   </div>
                   
                   <div className="trail-detail-weather-temps">
                     <span className="trail-detail-weather-high">{Math.round(day.maxTemp)}°</span>
                     <span className="trail-detail-weather-low">{Math.round(day.minTemp)}°</span>
                   </div>
                   
                   <div className="trail-detail-weather-condition">{day.condition}</div>
                   
                   <div className="trail-detail-weather-details">
                     <div className="trail-detail-weather-detail-item">
                       <Droplets size={14} />
                       <span>{day.humidity}%</span>
                     </div>
                     <div className="trail-detail-weather-detail-item">
                       <Wind size={14} />
                       <span>{day.windSpeed} m/s</span>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
            ) : (
              <div className="trail-detail-no-weather">
                <p>Weather data not available for this location.</p>
                <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                  This could be due to API limits or location data issues.
                </p>
              </div>
            )}
          </div>

          {/* User Actions */}
          {user && (
            <div className="trail-detail-user-actions">
              <h3>My Actions</h3>
              <div className="trail-detail-action-buttons">
                <button
                  className={`trail-detail-action-btn favourites ${userSaved.favourites.includes(trail.id) ? 'active' : ''}`}
                  onClick={() => handleTrailAction('favourites', trail.id)}
                  title={userSaved.favourites.includes(trail.id) ? 'Remove from favourites' : 'Add to favourites'}
                >
                  <Heart size={16} />
                  {userSaved.favourites.includes(trail.id) ? 'Favourited' : 'Favourite'}
                </button>

                <button
                  className={`trail-detail-action-btn wishlist ${userSaved.wishlist.includes(trail.id) ? 'active' : ''}`}
                  onClick={() => handleTrailAction('wishlist', trail.id)}
                  title={userSaved.wishlist.includes(trail.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Bookmark size={16} />
                  {userSaved.wishlist.includes(trail.id) ? 'In Wishlist' : 'Add to Wishlist'}
                </button>

                <button
                  className={`trail-detail-action-btn completed ${userSaved.completed.includes(trail.id) ? 'active' : ''}`}
                  onClick={() => handleTrailAction('completed', trail.id)}
                  title={userSaved.completed.includes(trail.id) ? 'Mark as not completed' : 'Mark as completed'}
                >
                  <Check size={16} />
                  {userSaved.completed.includes(trail.id) ? 'Completed' : 'Mark Complete'}
                </button>

                {user.uid === trail.authorId && (
                  <button
                    className="trail-detail-action-btn edit"
                    onClick={() => navigate(`/trails/${trail.id}/edit`)}
                    title="Edit trail"
                  >
                    <Edit3 size={16} />
                    Edit Trail
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab Section */}
          <div className="trail-detail-tab-section">
            {/* Tab Navigation */}
            <div className="trail-detail-tab-nav">
              <button
                className={`trail-detail-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                <MessageSquare size={18} />
                Reviews ({reviews.length})
              </button>
              <button
                className={`trail-detail-tab-btn ${activeTab === 'media' ? 'active' : ''}`}
                onClick={() => setActiveTab('media')}
              >
                <Image size={18} />
                Media ({trail?.photos?.length || 0})
              </button>
              <button
                className={`trail-detail-tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
                onClick={() => setActiveTab('alerts')}
              >
                <Bell size={18} />
                Alerts
              </button>
            </div>

            {/* Tab Content */}
            <div className="trail-detail-tab-content">
              {/* Reviews Tab */}
              {activeTab === 'reviews' && (
                <div className="trail-detail-tab-panel">
                  <div className="trail-detail-reviews-header">
                    <button
                      className="trail-detail-contribute-btn"
                      onClick={() => openContributionModal('review')}
                      title="Add a review"
                    >
                      <Plus size={16} />
                      Add Review
                    </button>
                    {reviews.length > 0 && (
                      <div className="trail-detail-review-sort">
                        <label htmlFor="review-sort">Sort by:</label>
                        <select
                          id="review-sort"
                          value={reviewSortBy}
                          onChange={(e) => setReviewSortBy(e.target.value)}
                          className="trail-detail-sort-select"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="highest">Highest Rating</option>
                          <option value="lowest">Lowest Rating</option>
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {loadingReviews ? (
                    <div className="trail-detail-loading">Loading reviews...</div>
                  ) : reviews.length > 0 ? (
                    <div className="trail-detail-reviews-container">
                      <div className="trail-detail-reviews-list">
                        {getSortedReviews().map((review) => (
                          <div key={review.id} className="trail-detail-review">
                            <div className="trail-detail-review-header">
                              <div className="trail-detail-review-author">
                                <strong>{review.userName || 'Anonymous'}</strong>
                              </div>
                              <div className="trail-detail-review-rating">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    fill={i < (review.rating || 0) ? "currentColor" : "none"}
                                    color={i < (review.rating || 0) ? "#ffc107" : "rgba(255, 255, 255, 0.3)"}
                                  />
                                ))}
                              </div>
                              <div className="trail-detail-review-date">
                                {new Date(review.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="trail-detail-review-content">
                              <p>{review.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="trail-detail-no-reviews">No reviews yet. Be the first to review this trail!</p>
                  )}
                </div>
              )}

              {/* Media Tab */}
              {activeTab === 'media' && (
                <div className="trail-detail-tab-panel">
                  <div className="trail-detail-media-header">
                    <button
                      className="trail-detail-contribute-btn"
                      onClick={() => openContributionModal('image')}
                      title="Upload images"
                    >
                      <Upload size={16} />
                      Upload Images
                    </button>
                  </div>
                  <div className="trail-detail-media-gallery">
                    {trail?.photos && trail.photos.length > 0 ? (
                      <div className="trail-detail-media-grid">
                        {trail.photos.map((photo, index) => (
                          <div
                            key={index}
                            className="trail-detail-media-item"
                            onClick={() => setCurrentImageIndex(index)}
                          >
                            <img
                              src={photo}
                              alt={`Trail photo ${index + 1}`}
                              className="trail-detail-media-thumbnail"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="trail-detail-no-media">No photos available for this trail.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Alerts Tab */}
              {activeTab === 'alerts' && (
                <div className="trail-detail-tab-panel">
                  <div className="trail-detail-alerts-header">
                    <button
                      className="trail-detail-contribute-btn"
                      onClick={() => openContributionModal('alert')}
                      title="Add an alert"
                    >
                      <AlertTriangle size={16} />
                      Add Alert
                    </button>
                  </div>
                  <div className="trail-detail-alerts-content">
                    {/* Trail Status Alert */}
                    <div className="trail-detail-alert-item">
                      <div className="trail-detail-alert-header">
                        <Bell size={20} />
                        <h4>Trail Status</h4>
                      </div>
                      <div className="trail-detail-status-info">
                        <p>Status: <span className={`status-${trail?.status || 'unknown'}`}>{trail?.status || 'Unknown'}</span></p>
                        {trail?.status === 'closed' && (
                          <p className="trail-detail-closure-notice">
                            ⚠️ This trail is currently closed. Please check back later or contact local authorities for more information.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Safety Tips */}
                    <div className="trail-detail-alert-item">
                      <div className="trail-detail-alert-header">
                        <Bell size={20} />
                        <h4>Safety Tips</h4>
                      </div>
                      <div className="trail-detail-safety-tips">
                        <ul>
                          <li>Always bring enough water and snacks</li>
                          <li>Check weather conditions before starting</li>
                          <li>Inform someone of your hiking plans</li>
                          <li>Bring a first aid kit and emergency supplies</li>
                          <li>Stay on marked trails</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contribution Modal */}
      {showContributionModal && (
        <div className="trail-detail-modal-overlay" onClick={closeContributionModal}>
          <div className="trail-detail-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="trail-detail-modal-header">
              <h3>
                {contributionType === 'review' && 'Add Review'}
                {contributionType === 'image' && 'Upload Images'}
                {contributionType === 'alert' && 'Add Alert'}
              </h3>
              <button className="trail-detail-modal-close" onClick={closeContributionModal}>
                ×
              </button>
            </div>

            <div className="trail-detail-modal-body">
              {/* Review Form */}
              {contributionType === 'review' && (
                <div className="trail-detail-form-group">
                  <label>Rating</label>
                  <div className="trail-detail-rating-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="trail-detail-star-btn"
                        onClick={() => setNewRating(star)}
                      >
                        <Star 
                          size={20} 
                          fill={star <= newRating ? "currentColor" : "none"} 
                          color={star <= newRating ? "gold" : "#ccc"}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Text */}
              {contributionType === 'review' && (
                <div className="trail-detail-form-group">
                  <label>Your Review</label>
                  <textarea
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    placeholder="Share your experience on this trail..."
                    className="trail-detail-textarea"
                    rows={4}
                  />
                </div>
              )}

              {/* Anonymous Option for Reviews */}
              {contributionType === 'review' && (
                <div className="trail-detail-form-group">
                  <label className="trail-detail-checkbox-label">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    Post anonymously
                  </label>
                </div>
              )}

              {/* Image Upload */}
              {contributionType === 'image' && (
                <div className="trail-detail-form-group">
                  <label>Select Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="trail-detail-file-input"
                  />
                  {newImages.length > 0 && (
                    <div className="trail-detail-image-preview">
                      <p>{newImages.length} image(s) selected</p>
                    </div>
                  )}
                </div>
              )}

              {/* Alert Type */}
              {contributionType === 'alert' && (
                <div className="trail-detail-form-group">
                  <label>Alert Type</label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value)}
                    className="trail-detail-select"
                  >
                    <option value="general">General</option>
                    <option value="safety">Safety</option>
                    <option value="weather">Weather</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="wildlife">Wildlife</option>
                  </select>
                </div>
              )}

              {/* Alert Message */}
              {contributionType === 'alert' && (
                <div className="trail-detail-form-group">
                  <label>Alert Message</label>
                  <textarea
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    placeholder="Describe the alert or important information..."
                    className="trail-detail-textarea"
                    rows={4}
                  />
                </div>
              )}
            </div>

            <div className="trail-detail-modal-footer">
              <button
                className="trail-detail-btn trail-detail-btn-secondary"
                onClick={closeContributionModal}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className="trail-detail-btn trail-detail-btn-primary"
                onClick={() => {
                  if (contributionType === 'review') handleAddReview();
                  if (contributionType === 'image') handleAddImages();
                  if (contributionType === 'alert') handleAddAlert();
                }}
                disabled={uploading}
              >
                {uploading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrailDetail;

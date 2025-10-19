import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  Shield,
  AlertCircle,
  Star,
  MessageSquare,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  X,
  Tag,
} from 'lucide-react';

// Import components
import AlertsPopup from '../components/AlertsPopup';
import ReviewsTrailCard from '../components/ReviewsTrailCard';
import ReviewsTrailSkeleton from '../components/ReviewsTrailSkeleton';
import SuccessPopup from '../components/SuccessPopup';
import AlertModal from '../components/modals/AlertModal';
import { useTrailAlerts } from '../hooks/useTrailAlerts';
import { useTrailUserActions } from '../hooks/useTrailUserActions';
import './ReviewsMedia.css';

// =========================
// 🎨 Responsive Styles
// =========================
const responsiveStyles = {
  container: {
    padding: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: "'Inter', sans-serif",
    color: '#f5f5f5',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
    marginTop: '2rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 70,
    padding: '1rem',
  },
  modalContent: {
    background: '#1c2540',
    padding: '2rem',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
    transform: 'scale(0.95)',
    animation: 'fadeIn 0.25s ease forwards',
  },
  textarea: {
    width: '100%',
    minHeight: '100px',
    marginTop: '0.5rem',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #444',
    background: '#0b132b',
    color: '#f5f5f5',
    fontSize: '1rem',
    resize: 'vertical',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '1rem',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  primaryButton: {
    padding: '0.6rem 1.2rem',
    borderRadius: '20px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    backgroundColor: '#00b894',
    color: '#fff',
    transition: 'background 0.2s ease',
  },
  cancelButton: {
    padding: '0.6rem 1.2rem',
    borderRadius: '20px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    backgroundColor: '#636e72',
    color: '#fff',
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '2rem',
    padding: '2rem',
    background: 'rgba(28, 37, 64, 0.6)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  searchRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    gap: '1rem',
    alignItems: 'center',
  },
  searchInput: {
    padding: '0.875rem 1rem 0.875rem 2.5rem',
    borderRadius: '12px',
    border: '1px solid #444',
    background: '#0b132b',
    color: '#f5f5f5',
    fontSize: '1rem',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#00b894',
    },
  },
  selectInput: {
    padding: '0.875rem 1rem',
    borderRadius: '12px',
    border: '1px solid #444',
    background: '#0b132b',
    color: '#f5f5f5',
    fontSize: '1rem',
    minWidth: '180px',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#00b894',
    },
  },
  filterRow: {
    display: 'flex',
    gap: '1.5rem',
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: '1rem 0',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  filterChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    background: '#00b894',
    color: '#fff',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'background-color 0.2s ease',
    '&:hover': {
      background: '#00a085',
    },
  },
  clearButton: {
    padding: '0.75rem 1.25rem',
    borderRadius: '12px',
    border: '1px solid #636e72',
    background: 'transparent',
    color: '#636e72',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    '&:hover': {
      background: '#636e72',
      color: '#fff',
    },
  },
  resultsInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#a0a0a0',
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
    padding: '0.75rem 1rem',
    background: 'rgba(0, 184, 148, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(0, 184, 148, 0.2)',
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  filterLabel: {
    color: '#a0a0a0',
    fontSize: '0.9rem',
    fontWeight: 500,
    minWidth: 'fit-content',
  },
  ratingSlider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
};

// Helper for inline style
const getResponsiveStyle = styleKey => responsiveStyles[styleKey] || {};

// =========================
// 📡 API Helpers
// =========================
async function fetchTrails() {
  const res = await fetch('https://us-central1-orion-sdp.cloudfunctions.net/getTrails');
  if (!res.ok) throw new Error('Failed to fetch trails');
  return res.json();
}

async function fetchTrailReviews(trailId) {
  const res = await fetch(
    `https://us-central1-orion-sdp.cloudfunctions.net/getTrailReviews?trailId=${trailId}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.reviews || [];
}

async function fetchTrailAlerts(trailId) {
  try {
    const res = await fetch(
      `https://gettrailalerts-fqtduxc7ua-uc.a.run.app/getAlerts?trailId=${trailId}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.alerts || [];
  } catch {
    return [];
  }
}

// Add this function to calculate average rating
function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;

  const sum = reviews.reduce((total, review) => total + (review.rating || 0), 0);
  return sum / reviews.length;
}

// =========================
// 🌲 Main Component
// =========================
export default function ReviewsMedia() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL parameters
  const getInitialFilters = () => {
    const difficulty = searchParams.get('difficulty') || 'all';
    const tags = searchParams.get('tags') ? searchParams.get('tags').split(',') : [];
    const minRating = parseFloat(searchParams.get('minRating')) || 0;
    const searchQuery = searchParams.get('search') || '';

    return {
      minRating,
      maxRating: 5,
      difficulty,
      features: [],
      tags,
    };
  };

  const [trails, setTrails] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredTrailId, setHoveredTrailId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [alertsPopup, setAlertsPopup] = useState({
    isVisible: false,
    position: { x: 0, y: 0 },
    alerts: [],
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedTrailId, setSelectedTrailId] = useState(null);

  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [newImages, setNewImages] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Alert modal states
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Success popup state
  const [successPopup, setSuccessPopup] = useState({
    isVisible: false,
    message: '',
  });

  // Add user authentication state
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Search, sort, and filter state - initialize from URL params
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filters, setFilters] = useState(getInitialFilters());
  const [showAllTags, setShowAllTags] = useState(false);

  // Use the useTrailAlerts hook
  const { trailAlerts, loadingStates, fetchTrailAlerts, isAlertExpired, getTimeRemaining } =
    useTrailAlerts();

  // Use the useTrailUserActions hook for favorites
  const { userSaved, handleTrailAction } = useTrailUserActions();

  // Get all unique tags from trails with usage counts
  const getAllUniqueTags = useMemo(() => {
    if (!Array.isArray(trails)) return [];

    const tagCounts = {};
    trails.forEach(trail => {
      if (trail.tags && Array.isArray(trail.tags)) {
        trail.tags.forEach(tag => {
          if (typeof tag === 'string' && tag.trim()) {
            const trimmedTag = tag.trim();
            tagCounts[trimmedTag] = (tagCounts[trimmedTag] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [trails]);

  // Filter and sort trails
  const filteredAndSortedTrails = useMemo(() => {
    if (!Array.isArray(trails)) return [];

    // Debug: Log some trail data to understand the structure
    if (trails.length > 0) {
      console.log('Sample trail data:', {
        name: trails[0].name,
        difficulty: trails[0].difficulty,
        difficultyType: typeof trails[0].difficulty,
      });
    }

    let filtered = trails.filter(trail => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (trail.name &&
            typeof trail.name === 'string' &&
            trail.name.toLowerCase().includes(query)) ||
          (trail.description &&
            typeof trail.description === 'string' &&
            trail.description.toLowerCase().includes(query)) ||
          (trail.location &&
            typeof trail.location === 'string' &&
            trail.location.toLowerCase().includes(query)) ||
          (trail.city &&
            typeof trail.city === 'string' &&
            trail.city.toLowerCase().includes(query)) ||
          (trail.state &&
            typeof trail.state === 'string' &&
            trail.state.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Rating filter
      if (trail.averageRating < filters.minRating || trail.averageRating > filters.maxRating) {
        return false;
      }

      // Difficulty filter
      if (
        filters.difficulty !== 'all' &&
        trail.difficulty?.toLowerCase() !== filters.difficulty.toLowerCase()
      ) {
        return false;
      }

      // Features filter (if trail has features property)
      if (filters.features.length > 0 && trail.features) {
        const hasMatchingFeature = filters.features.some(feature =>
          trail.features.includes(feature)
        );
        if (!hasMatchingFeature) return false;
      }

      // Tags filter
      if (filters.tags.length > 0 && trail.tags && Array.isArray(trail.tags)) {
        const hasMatchingTag = filters.tags.some(filterTag =>
          trail.tags.some(
            trailTag =>
              typeof trailTag === 'string' &&
              trailTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });

    // Sort trails
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'rating':
          aValue = a.averageRating || 0;
          bValue = b.averageRating || 0;
          break;
        case 'reviews':
          aValue = a.reviewCount || 0;
          bValue = b.reviewCount || 0;
          break;
        case 'difficulty':
          const difficultyOrder = { easy: 1, moderate: 2, hard: 3, difficult: 3, expert: 4 };
          aValue = difficultyOrder[a.difficulty?.toLowerCase()] || 0;
          bValue = difficultyOrder[b.difficulty?.toLowerCase()] || 0;
          break;
        default:
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [trails, searchQuery, sortBy, sortOrder, filters]);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Search, sort, and filter handlers
  // Function to update URL parameters
  const updateURLParams = (newFilters, newSearchQuery) => {
    const params = new URLSearchParams();

    if (newSearchQuery) {
      params.set('search', newSearchQuery);
    }

    if (newFilters.difficulty && newFilters.difficulty !== 'all') {
      params.set('difficulty', newFilters.difficulty);
    }

    if (newFilters.minRating && newFilters.minRating > 0) {
      params.set('minRating', newFilters.minRating.toString());
    }

    if (newFilters.tags && newFilters.tags.length > 0) {
      params.set('tags', newFilters.tags.join(','));
    }

    setSearchParams(params);
  };

  const handleSearchChange = e => {
    const newSearchQuery = e.target.value;
    setSearchQuery(newSearchQuery);
    updateURLParams(filters, newSearchQuery);
  };

  const handleSortChange = e => {
    setSortBy(e.target.value);
  };

  const handleSortOrderToggle = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = {
      ...filters,
      [filterType]: value,
    };
    setFilters(newFilters);
    updateURLParams(newFilters, searchQuery);
  };

  const handleFeatureToggle = feature => {
    const newFilters = {
      ...filters,
      features: filters.features.includes(feature)
        ? filters.features.filter(f => f !== feature)
        : [...filters.features, feature],
    };
    setFilters(newFilters);
    updateURLParams(newFilters, searchQuery);
  };

  const handleTagToggle = tag => {
    const newFilters = {
      ...filters,
      tags: filters.tags.includes(tag)
        ? filters.tags.filter(t => t !== tag)
        : [...filters.tags, tag],
    };
    setFilters(newFilters);
    updateURLParams(newFilters, searchQuery);
  };

  const clearAllFilters = () => {
    const newFilters = {
      minRating: 0,
      maxRating: 5,
      difficulty: 'all',
      features: [],
      tags: [],
    };
    setSearchQuery('');
    setSortBy('name');
    setSortOrder('asc');
    setFilters(newFilters);
    setSearchParams(new URLSearchParams()); // Clear all URL params
  };

  const handleOpenTrailDetail = trail => {
    // Navigate to the trail detail page
    navigate(`/trails/${trail.id}`, { state: { trail } });
  };

  const handleShowAlertsPopup = (event, trailAlerts) => {
    if (!trailAlerts || trailAlerts.length === 0) return;

    // Filter out expired alerts
    const activeAlerts = trailAlerts.filter(alert => !isAlertExpired(alert));
    if (activeAlerts.length === 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    setAlertsPopup({
      isVisible: true,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      },
      alerts: activeAlerts,
    });
  };

  const handleHideAlertsPopup = () => {
    setAlertsPopup({
      isVisible: false,
      position: { x: 0, y: 0 },
      alerts: [],
    });
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load before fetching trails
    (async () => {
      try {
        const data = await fetchTrails();

        // Process trails progressively - show them as they load
        setTrails(
          data.map(trail => ({
            ...trail,
            photos: [],
            averageRating: 0,
            reviewCount: 0,
            processedPhotos: false,
            hasReviews: false,
            hasAlerts: false,
          }))
        );
        setLoading(false);

        // Process photos, reviews, and alerts in parallel for each trail
        const reviewsData = {};
        const alertsData = {};

        // Process trails in batches to avoid overwhelming the browser
        const batchSize = 5;
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);

          const batchResults = await Promise.all(
            batch.map(async trail => {
              try {
                // Process photos with timeout
                let photos = [];
                let processedPhotos = true;
                if (trail.photos?.length > 0) {
                  try {
                    const photoPromises = trail.photos.map(async path => {
                      try {
                        if (path.startsWith('https://')) return path;
                        return await getDownloadURL(ref(storage, path));
                      } catch {
                        return null;
                      }
                    });

                    // Add timeout for photo processing
                    const timeoutPromise = new Promise((_, reject) =>
                      setTimeout(() => reject(new Error('Photo processing timeout')), 10000)
                    );

                    const urls = await Promise.race([Promise.all(photoPromises), timeoutPromise]);
                    photos = urls.filter(Boolean);
                  } catch (error) {
                    console.warn(`Failed to process photos for trail ${trail.id}:`, error);
                    photos = [];
                    processedPhotos = false;
                  }
                }

                // Fetch reviews and calculate ratings with timeout
                let trailReviews = [];
                let hasReviews = false;
                try {
                  const reviewPromise = fetchTrailReviews(trail.id);
                  const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Review fetch timeout')), 8000)
                  );

                  trailReviews = await Promise.race([reviewPromise, timeoutPromise]);
                  hasReviews = true;
                } catch (error) {
                  console.warn(`Failed to fetch reviews for trail ${trail.id}:`, error);
                  trailReviews = [];
                }

                const averageRating = calculateAverageRating(trailReviews);
                const reviewCount = trailReviews.length;

                // Fetch alerts using the hook
                let hasAlerts = false;
                try {
                  await fetchTrailAlerts(trail.id);
                  hasAlerts = true;
                } catch (error) {
                  console.warn(`Failed to fetch alerts for trail ${trail.id}:`, error);
                }

                // Store data
                reviewsData[trail.id] = trailReviews;

                return {
                  ...trail,
                  photos,
                  averageRating,
                  reviewCount,
                  processedPhotos,
                  hasReviews,
                  hasAlerts,
                };
              } catch (error) {
                console.error(`Failed to process trail ${trail.id}:`, error);
                // Return trail with minimal data to prevent infinite loading
                return {
                  ...trail,
                  photos: [],
                  averageRating: 0,
                  reviewCount: 0,
                  processedPhotos: true, // Mark as processed to stop loading
                  hasReviews: false,
                  hasAlerts: false,
                };
              }
            })
          );

          // Update trails progressively
          setTrails(prevTrails =>
            prevTrails.map(trail => {
              const updatedTrail = batchResults.find(t => t.id === trail.id);
              return updatedTrail || trail;
            })
          );
        }

        setReviews(reviewsData);
      } catch (err) {
        setError('Could not load trails or reviews');
        setLoading(false);
      }
    })();
  }, [authLoading]);

  const uploadPhotos = async files => {
    const urls = [];
    for (let file of files) {
      const fileRef = ref(storage, `trails/${uuidv4()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      urls.push(url);
    }
    return urls;
  };

  const openModal = (trailId, type) => {
    // Check if user is logged in for review submission
    if (type === 'review' && !user) {
      alert('Please log in to submit a review');
      return;
    }

    if (type === 'alert' && !user) {
      alert('Please log in to submit an alert');
      return;
    }

    if (type === 'alert') {
      setSelectedTrailId(trailId);
      setShowAlertModal(true);
      return;
    }

    setSelectedTrailId(trailId);
    setModalType(type);
    setNewReview('');
    setNewRating(0);
    setNewImages([]);
    setIsAnonymous(false);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setSelectedTrailId(null);
    setModalType(null);
    setNewReview('');
    setNewRating(0);
    setIsAnonymous(false);
  };

  const closeSuccessPopup = () => {
    setSuccessPopup({
      isVisible: false,
      message: '',
    });
  };

  const handleAddReview = async () => {
    if (!newReview) return;
    try {
      // Use actual user data or anonymous based on user choice
      const userDisplayName = isAnonymous ? 'Anonymous' : user.displayName || user.email || 'User';

      const response = await fetch(
        'https://us-central1-orion-sdp.cloudfunctions.net/addTrailReview',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trailId: selectedTrailId,
            review: {
              id: uuidv4(),
              message: newReview,
              rating: newRating,
              timestamp: new Date().toISOString(),
              userId: user.uid, // Use actual user ID
              userName: userDisplayName, // Use actual user name
              userEmail: user.email, // Optional: store email for reference
            },
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Server returned ${response.status}`);

      // Refetch reviews to update the average rating
      const updatedReviews = await fetchTrailReviews(selectedTrailId);
      setReviews(prev => ({
        ...prev,
        [selectedTrailId]: updatedReviews,
      }));

      // Update the trail's average rating
      const averageRating = calculateAverageRating(updatedReviews);
      setTrails(prev =>
        prev.map(trail =>
          trail.id === selectedTrailId
            ? { ...trail, averageRating, reviewCount: updatedReviews.length }
            : trail
        )
      );
      closeModal();
      setSuccessPopup({
        isVisible: true,
        message: 'Your review has been submitted successfully!',
      });
    } catch (err) {
      alert('Failed to add review: ' + err.message);
    }
  };

  const handleAddAlert = async alertData => {
    try {
      const firestoreAlertData = {
        trailId: selectedTrailId,
        message: alertData.message,
        type: alertData.type,
        isActive: true,
        timestamp: serverTimestamp(),
      };

      // Add expiration time if it's a timed alert
      if (alertData.isTimed && alertData.duration) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + alertData.duration * 60 * 1000);
        firestoreAlertData.expiresAt = expiresAt;
        firestoreAlertData.isTimed = true;
      }

      // Create alert directly in Firestore
      await addDoc(collection(db, 'Alerts'), firestoreAlertData);

      setShowAlertModal(false);
      setSuccessPopup({
        isVisible: true,
        message: 'Your alert has been submitted successfully!',
      });
    } catch (err) {
      alert('Failed to add alert: ' + err.message);
    }
  };

  const handleAddImages = async () => {
    if (!newImages.length) return;
    try {
      const uploadedUrls = await uploadPhotos(newImages);

      const response = await fetch(
        'https://us-central1-orion-sdp.cloudfunctions.net/updateTrailImages',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trailId: selectedTrailId,
            photos: uploadedUrls,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Server returned ${response.status}`);
      const updatedTrails = await fetchTrails();
      setTrails(updatedTrails);
      closeModal();
      setSuccessPopup({
        isVisible: true,
        message: 'Your images have been uploaded successfully!',
      });
    } catch (err) {
      alert('Failed to add images: ' + err.message);
    }
  };

  if (authLoading)
    return (
      <div style={getResponsiveStyle('container')}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div
            style={{
              fontSize: '1.2rem',
              color: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <Shield size={18} />
            Authenticating...
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div style={getResponsiveStyle('container')}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div
            style={{
              color: '#ff6b6b',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={18} />
            {error}
          </div>
          <button
            style={{ ...getResponsiveStyle('primaryButton'), marginTop: '1rem' }}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );

  return (
    <div style={getResponsiveStyle('container')}>
      <h1 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MessageSquare size={20} />
        Trail Reviews & Media
      </h1>

      {/* Search, Sort, and Filter Controls */}
      <div style={getResponsiveStyle('searchContainer')}>
        {/* Search Row */}
        <div
          style={{
            ...getResponsiveStyle('searchRow'),
            ...(isMobile
              ? {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }
              : {}),
          }}
        >
          <div style={{ position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#a0a0a0',
              }}
            />
            <input
              type='text'
              placeholder='Search trails by name, location, or description...'
              value={searchQuery}
              onChange={handleSearchChange}
              style={getResponsiveStyle('searchInput')}
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              ...(isMobile ? { flexDirection: 'column' } : {}),
            }}
          >
            <select
              value={sortBy}
              onChange={handleSortChange}
              style={getResponsiveStyle('selectInput')}
            >
              <option value='name'>Sort by Name</option>
              <option value='rating'>Sort by Rating</option>
              <option value='reviews'>Sort by Review Count</option>
              <option value='difficulty'>Sort by Difficulty</option>
            </select>

            <button
              onClick={handleSortOrderToggle}
              style={{
                ...getResponsiveStyle('primaryButton'),
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.25rem',
                minWidth: '140px',
                justifyContent: 'center',
              }}
            >
              {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div
          style={{
            ...getResponsiveStyle('filterRow'),
            ...(isMobile
              ? {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '1rem',
                }
              : {}),
          }}
        >
          <div style={getResponsiveStyle('filterSection')}>
            <Filter size={16} style={{ color: '#a0a0a0' }} />
            <span style={getResponsiveStyle('filterLabel')}>Filters:</span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              alignItems: 'center',
              ...(isMobile ? { width: '100%' } : {}),
            }}
          >
            <div style={getResponsiveStyle('filterSection')}>
              <span style={getResponsiveStyle('filterLabel')}>Difficulty:</span>
              <select
                value={filters.difficulty}
                onChange={e => handleFilterChange('difficulty', e.target.value)}
                style={getResponsiveStyle('selectInput')}
              >
                <option value='all'>All Difficulties</option>
                <option value='easy'>Easy</option>
                <option value='moderate'>Moderate</option>
                <option value='hard'>Hard</option>
                <option value='difficult'>Difficult</option>
                <option value='expert'>Expert</option>
              </select>
            </div>

            <div style={getResponsiveStyle('ratingSlider')}>
              <span style={getResponsiveStyle('filterLabel')}>Min Rating:</span>
              <input
                type='range'
                min='0'
                max='5'
                step='0.5'
                value={filters.minRating}
                onChange={e => handleFilterChange('minRating', parseFloat(e.target.value))}
                style={{
                  width: '100px',
                  accentColor: '#00b894',
                }}
              />
              <span
                style={{
                  color: '#f5f5f5',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  minWidth: '40px',
                  textAlign: 'center',
                }}
              >
                {filters.minRating}+
              </span>
            </div>

            {(searchQuery ||
              filters.difficulty !== 'all' ||
              filters.minRating > 0 ||
              filters.features.length > 0 ||
              filters.tags.length > 0) && (
              <button onClick={clearAllFilters} style={getResponsiveStyle('clearButton')}>
                <X size={14} />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Tag Filter Section */}
        {getAllUniqueTags.length > 0 && (
          <div
            style={{
              ...getResponsiveStyle('filterRow'),
              ...(isMobile
                ? {
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '1rem',
                  }
                : {}),
            }}
          >
            <div style={getResponsiveStyle('filterSection')}>
              <Tag size={16} style={{ color: '#a0a0a0' }} />
              <span style={getResponsiveStyle('filterLabel')}>Tags:</span>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                ...(isMobile ? { width: '100%' } : {}),
              }}
            >
              {(showAllTags ? getAllUniqueTags : getAllUniqueTags.slice(0, 10)).map(tagData => (
                <button
                  key={tagData.tag}
                  onClick={() => handleTagToggle(tagData.tag)}
                  style={{
                    ...getResponsiveStyle('filterChip'),
                    background: filters.tags.includes(tagData.tag)
                      ? 'var(--accent)'
                      : 'var(--bg-elevated)',
                    color: filters.tags.includes(tagData.tag) ? '#fff' : 'var(--text-primary)',
                    border: `1px solid ${filters.tags.includes(tagData.tag) ? 'var(--accent)' : 'var(--border)'}`,
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: '0.375rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <span>{tagData.tag}</span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      opacity: 0.8,
                      background: 'rgba(255, 255, 255, 0.1)',
                      padding: '0.125rem 0.25rem',
                      borderRadius: '4px',
                    }}
                  >
                    {tagData.count}
                  </span>
                </button>
              ))}
              {!showAllTags && getAllUniqueTags.length > 10 && (
                <button
                  onClick={() => setShowAllTags(true)}
                  style={{
                    ...getResponsiveStyle('filterChip'),
                    background: 'var(--bg-elevated)',
                    color: 'var(--accent)',
                    border: '1px solid var(--accent)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: '0.375rem 0.75rem',
                    fontWeight: '500',
                  }}
                >
                  Show All ({getAllUniqueTags.length})
                </button>
              )}
              {showAllTags && (
                <button
                  onClick={() => setShowAllTags(false)}
                  style={{
                    ...getResponsiveStyle('filterChip'),
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: '0.375rem 0.75rem',
                    fontWeight: '500',
                  }}
                >
                  Show Less
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {(filters.difficulty !== 'all' ||
          filters.minRating > 0 ||
          filters.features.length > 0 ||
          filters.tags.length > 0) && (
          <div
            style={{
              ...getResponsiveStyle('filterRow'),
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '1rem',
              marginTop: '0.5rem',
            }}
          >
            <span style={getResponsiveStyle('filterLabel')}>Active filters:</span>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {filters.difficulty !== 'all' && (
                <div style={getResponsiveStyle('filterChip')}>
                  Difficulty: {filters.difficulty}
                  <X
                    size={14}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleFilterChange('difficulty', 'all')}
                  />
                </div>
              )}
              {filters.minRating > 0 && (
                <div style={getResponsiveStyle('filterChip')}>
                  Rating: {filters.minRating}+
                  <X
                    size={14}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleFilterChange('minRating', 0)}
                  />
                </div>
              )}
              {filters.features.map(feature => (
                <div key={feature} style={getResponsiveStyle('filterChip')}>
                  {feature}
                  <X
                    size={14}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleFeatureToggle(feature)}
                  />
                </div>
              ))}
              {filters.tags.map(tag => (
                <div key={tag} style={getResponsiveStyle('filterChip')}>
                  Tag: {tag}
                  <X size={14} style={{ cursor: 'pointer' }} onClick={() => handleTagToggle(tag)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div style={getResponsiveStyle('resultsInfo')}>
        <span>
          Showing {filteredAndSortedTrails.length} of {trails.length} trails
        </span>
        {searchQuery && <span>• Searching for "{searchQuery}"</span>}
      </div>

      <div style={getResponsiveStyle('gridContainer')}>
        {Array.isArray(filteredAndSortedTrails) ? (
          filteredAndSortedTrails.map(trail => {
            // Show skeleton if trail is still loading (check if it has been processed)
            // A trail is considered loaded if it has been processed (has processedPhotos flag or has data)
            const isLoading = !trail.processedPhotos && !trail.hasReviews && !trail.hasAlerts;

            if (isLoading) {
              return <ReviewsTrailSkeleton key={trail.id} />;
            }

            return (
              <ReviewsTrailCard
                key={trail.id}
                trail={trail}
                alerts={trailAlerts}
                reviews={reviews}
                user={user}
                userSaved={userSaved}
                handleTrailAction={handleTrailAction}
                loadedImages={loadedImages}
                setLoadedImages={setLoadedImages}
                onShowAlertsPopup={handleShowAlertsPopup}
                onHideAlertsPopup={handleHideAlertsPopup}
                onOpenModal={openModal}
                onOpenTrailDetail={handleOpenTrailDetail}
              />
            );
          })
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#f5f5f5' }}>
            <div>Loading trails...</div>
          </div>
        )}
      </div>

      {/* Alerts Popup */}
      <AlertsPopup
        isVisible={alertsPopup.isVisible}
        position={alertsPopup.position}
        alerts={alertsPopup.alerts}
        onMouseLeave={handleHideAlertsPopup}
      />

      {/* Success Popup */}
      <SuccessPopup
        isVisible={successPopup.isVisible}
        message={successPopup.message}
        onClose={closeSuccessPopup}
      />

      {modalOpen && (
        <div style={getResponsiveStyle('modalOverlay')} onClick={closeModal}>
          <div style={getResponsiveStyle('modalContent')} onClick={e => e.stopPropagation()}>
            {modalType === 'review' && (
              <>
                <h3>
                  Add Review {user && !isAnonymous && `(as ${user.displayName || user.email})`}
                </h3>
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      style={{
                        cursor: 'pointer',
                        color: newRating >= star ? 'gold' : '#ccc',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      onClick={() => setNewRating(star)}
                    >
                      <Star
                        size={20}
                        fill={newRating >= star ? 'currentColor' : 'none'}
                        color={newRating >= star ? 'gold' : '#ccc'}
                      />
                    </span>
                  ))}
                </div>

                <textarea
                  value={newReview}
                  onChange={e => setNewReview(e.target.value)}
                  placeholder='Write your review...'
                  style={getResponsiveStyle('textarea')}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <input
                    type='checkbox'
                    id='anonymous-review'
                    checked={isAnonymous}
                    onChange={e => setIsAnonymous(e.target.checked)}
                    style={{
                      width: '16px',
                      height: '16px',
                      accentColor: 'var(--accent)',
                    }}
                  />
                  <label
                    htmlFor='anonymous-review'
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Submit as anonymous
                  </label>
                </div>

                <div style={getResponsiveStyle('modalButtons')}>
                  <button style={getResponsiveStyle('cancelButton')} onClick={closeModal}>
                    Cancel
                  </button>
                  <button style={getResponsiveStyle('primaryButton')} onClick={handleAddReview}>
                    Submit
                  </button>
                </div>
              </>
            )}

            {modalType === 'images' && (
              <>
                <h3>Add Images</h3>
                <input
                  type='file'
                  multiple
                  accept='image/*'
                  onChange={e => setNewImages(Array.from(e.target.files))}
                  style={{ marginTop: '0.5rem', width: '100%' }}
                />
                <div style={getResponsiveStyle('modalButtons')}>
                  <button style={getResponsiveStyle('cancelButton')} onClick={closeModal}>
                    Cancel
                  </button>
                  <button style={getResponsiveStyle('primaryButton')} onClick={handleAddImages}>
                    Upload
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {selectedTrailId && (
        <AlertModal
          isVisible={showAlertModal}
          onClose={() => setShowAlertModal(false)}
          onSubmit={handleAddAlert}
          trailId={selectedTrailId}
          trailName={trails.find(t => t.id === selectedTrailId)?.name}
          loading={false}
        />
      )}
    </div>
  );
}

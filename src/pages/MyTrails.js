import React, { useEffect, useState } from 'react';
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Heart, CheckCircle, Bookmark, Upload, Mountain } from 'lucide-react';
import ReviewModal from '../components/modals/ReviewModal';
import StatusConfirmModal from '../components/modals/StatusConfirmModal';
import AlertsPopup from '../components/AlertsPopup';
import TrailCard from '../components/trails/TrailCard';
import MyTrailsFilter from '../components/MyTrailsFilter';
import './MyTrails.css';


export default function MyTrails() {
  const [trails, setTrails] = useState({ favourites: [], completed: [], wishlist: [], submitted: [] });
  const [alerts, setAlerts] = useState({});
  const [modalState, setModalState] = useState({
    isOpen: false,
    trailId: null,
    trailName: '',
  });
  const [statusConfirmState, setStatusConfirmState] = useState({
    isOpen: false,
    trailId: null,
    trailName: '',
    currentStatus: 'open',
  });
  const [activeTab, setActiveTab] = useState('favourites');
  const [loading, setLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    savedTrails: true,
    submittedTrails: true,
    alerts: true
  });
  const [cache, setCache] = useState({});
  const [alertsPopup, setAlertsPopup] = useState({
    isVisible: false,
    position: { x: 0, y: 0 },
    alerts: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    difficulty: 'all',
    minDistance: 0,
    maxDistance: 20,
    status: 'all'
  });
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user ? user.uid : null;

  useEffect(() => {
    async function fetchSavedTrails() {
      if (!userId) return;
      
      // Check cache first (5 minute cache)
      const cacheKey = `trails_${userId}`;
      const cachedData = cache[cacheKey];
      if (cachedData && Date.now() - cachedData.timestamp < 300000) {
        setTrails(cachedData.data);
        setAlerts(cachedData.alerts || {});
        setLoading(false);
        setLoadingStates({ savedTrails: false, submittedTrails: false, alerts: false });
        return;
      }
      
      try {
        setLoading(true);
        setLoadingStates({ savedTrails: true, submittedTrails: true, alerts: true });
        
        // Fetch saved trails from the API
        const res = await fetch(`https://getsavedtrails-fqtduxc7ua-uc.a.run.app?uid=${userId}`);
        const data = await res.json();
        
        setLoadingStates(prev => ({ ...prev, savedTrails: false }));
        
        // Fetch submitted trails from Firestore
        const userRef = doc(db, 'Users', userId);
        const userSnap = await getDoc(userRef);
        let submittedTrails = [];
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          if (userData.submittedTrails && userData.submittedTrails.length > 0) {
            const fetchTrailDetails = async (references) => {
              const details = [];
              const trailIds = [];
              
              // Extract trail IDs from references
              for (const ref of references) {
                if (typeof ref === 'string' && ref.startsWith('/Trails/')) {
                  trailIds.push(ref.split('/')[2]);
                } else if (ref && ref.path) {
                  trailIds.push(ref.path.split('/')[1]);
                } else if (ref && ref._path) {
                  const pathParts = ref._path.segments;
                  if (pathParts[0] === 'Trails') {
                    trailIds.push(pathParts[1]);
                  }
                }
              }
              
              // Batch fetch trails
              const trailPromises = trailIds.map(trailId => 
                getDoc(doc(db, 'Trails', trailId))
              );
              
              const trailDocs = await Promise.all(trailPromises);
              
              trailDocs.forEach((trailDoc, index) => {
                if (trailDoc.exists()) {
                  const trailData = trailDoc.data();
                  details.push({ 
                    id: trailDoc.id, 
                    ...trailData,
                    name: trailData.name || 'Unnamed Trail',
                    difficulty: trailData.difficulty || 'Unknown',
                    distance: trailData.distance || 0,
                    elevationGain: trailData.elevationGain || 0,
                    status: trailData.status || 'open',
                    createdAt: trailData.createdAt || trailData.lastUpdated
                  });
                }
              });
              
              return details;
            };
            
            submittedTrails = await fetchTrailDetails(userData.submittedTrails);
          }
        }
        
        setLoadingStates(prev => ({ ...prev, submittedTrails: false }));
        
        const trailsData = { ...data, submitted: submittedTrails };
        setTrails(trailsData);

        // Load alerts in background after main content is shown
        const allTrailsForAlerts = [...data.favourites, ...data.completed, ...data.wishlist, ...submittedTrails];
        console.log('Loading alerts for trails:', allTrailsForAlerts.length, 'trails');
        loadAlertsInBackground(allTrailsForAlerts);
        
        // Cache the results
        setCache(prev => ({
          ...prev,
          [cacheKey]: {
            data: trailsData,
            timestamp: Date.now()
          }
        }));
        
      } catch (err) {
        console.error('Error fetching saved trails:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSavedTrails();
  }, [userId]);

  // Separate function to load alerts in background
  const loadAlertsInBackground = async (allTrails) => {
    if (allTrails.length === 0) {
      console.log('No trails to load alerts for');
      setLoadingStates(prev => ({ ...prev, alerts: false }));
      return;
    }
    
    try {
      // Batch alerts API call - try to get all alerts in one request
      const trailIds = allTrails.map(trail => trail.id).join(',');
      console.log('Attempting batch alerts API call for trail IDs:', trailIds);
      
      try {
        // Try batch endpoint first
        const res = await fetch(
          `https://us-central1-orion-sdp.cloudfunctions.net/getAlerts?trailIds=${trailIds}`
        );
        
        console.log('Batch alerts API response status:', res.status);
        
        if (res.ok) {
          const batchAlertData = await res.json();
          console.log('Batch alerts data received:', batchAlertData);
          setAlerts(batchAlertData.alerts || {});
          setLoadingStates(prev => ({ ...prev, alerts: false }));
          return;
        }
      } catch (batchError) {
        console.log('Batch alerts not available, falling back to individual calls:', batchError);
      }
      
      // Fallback to individual calls if batch endpoint doesn't exist
      console.log('Using individual alerts API calls');
      const alertsData = {};
      const batchSize = 5; // Process in smaller batches to avoid overwhelming the server
      
      for (let i = 0; i < allTrails.length; i += batchSize) {
        const batch = allTrails.slice(i, i + batchSize);
        console.log(`Processing batch ${i/batchSize + 1} with ${batch.length} trails`);
        
        await Promise.all(
          batch.map(async (trail) => {
            try {
              const res = await fetch(
                `https://us-central1-orion-sdp.cloudfunctions.net/getAlerts?trailId=${trail.id}`
              );
              const alertData = await res.json();
              console.log(`Alerts for trail ${trail.name} (${trail.id}):`, alertData);
              alertsData[trail.id] = alertData.alerts || [];
            } catch (err) {
              console.error(`Error fetching alerts for ${trail.name}:`, err);
              alertsData[trail.id] = [];
            }
          })
        );
        
        // Update alerts progressively
        console.log('Updating alerts state with:', alertsData);
        setAlerts(prev => ({ ...prev, ...alertsData }));
      }
      
    } catch (err) {
      console.error('Error loading alerts:', err);
    } finally {
      setLoadingStates(prev => ({ ...prev, alerts: false }));
    }
  };


  const openReviewModal = (trailId, trailName) => {
    setModalState({
      isOpen: true,
      trailId,
      trailName,
    });
  };

  const closeReviewModal = () => {
    setModalState({
      isOpen: false,
      trailId: null,
      trailName: '',
    });
  };

  const openStatusConfirmModal = (trailId, trailName, currentStatus) => {
    setStatusConfirmState({
      isOpen: true,
      trailId,
      trailName,
      currentStatus,
    });
  };

  const closeStatusConfirmModal = () => {
    setStatusConfirmState({
      isOpen: false,
      trailId: null,
      trailName: '',
      currentStatus: 'open',
    });
  };

  const showAlertsPopup = (event, alerts) => {
    const rect = event.target.getBoundingClientRect();
    setAlertsPopup({
      isVisible: true,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8
      },
      alerts: alerts
    });
  };

  const hideAlertsPopup = () => {
    setAlertsPopup({
      isVisible: false,
      position: { x: 0, y: 0 },
      alerts: []
    });
  };

  // Filter management functions
  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      difficulty: 'all',
      minDistance: 0,
      maxDistance: 20,
      status: 'all'
    });
  };

  // Filter trails based on search query and filters
  const filterTrails = (trailArray) => {
    return trailArray.filter(trail => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = trail.name?.toLowerCase().includes(searchLower);
        if (!nameMatch) return false;
      }

      // Difficulty filter
      if (filters.difficulty !== 'all' && trail.difficulty !== filters.difficulty) {
        return false;
      }

      // Distance filter
      const trailDistance = parseFloat(trail.distance) || 0;
      if (trailDistance < filters.minDistance || trailDistance > filters.maxDistance) {
        return false;
      }

      // Status filter (only for submitted trails)
      if (activeTab === 'submitted' && filters.status !== 'all' && trail.status !== filters.status) {
        return false;
      }

      return true;
    });
  };

  const handleStatusChange = async () => {
    try {
      const { trailId, currentStatus } = statusConfirmState;
      const newStatus = currentStatus === 'open' ? 'closed' : 'open';

      // Update the trail status in Firestore
      const trailRef = doc(db, 'Trails', trailId);
      await updateDoc(trailRef, {
        status: newStatus,
        lastUpdated: new Date().toISOString()
      });

      // Update local state
      setTrails((prev) => ({
        ...prev,
        submitted: prev.submitted.map((trail) =>
          trail.id === trailId ? { ...trail, status: newStatus } : trail
        ),
      }));

      closeStatusConfirmModal();
      alert(`Trail ${newStatus === 'closed' ? 'closed' : 'reopened'} successfully!`);
    } catch (err) {
      console.error('Failed to update trail status:', err);
      alert('Failed to update trail status. Please try again.');
    }
  };

  const handleMarkAsCompleted = async (rating, comment) => {
    try {
      const { trailId } = modalState;

      // Generate a unique ID for the review
      const generateId = () => {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
      };

      // Mark trail as completed
      await fetch("https://us-central1-orion-sdp.cloudfunctions.net/markCompleted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: userId, trailId }),
      });

      // Add review to the trail
      const reviewResponse = await fetch(
        "https://us-central1-orion-sdp.cloudfunctions.net/addTrailReview",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trailId: trailId,
            review: {
              id: generateId(),
              rating: rating,
              comment: comment,
              timestamp: new Date().toISOString(),
              userId: userId,
              userName: user?.displayName || "Anonymous User"
            }
          }),
        }
      );

      const result = await reviewResponse.json();

      if (!reviewResponse.ok) {
        throw new Error(result.error || `Server returned ${reviewResponse.status}`);
      }

      // Update local state
      setTrails((prev) => {
        const trail =
          prev.favourites.find((t) => t.id === trailId) ||
          prev.wishlist.find((t) => t.id === trailId);

        if (!trail) return prev;

        return {
          ...prev,
          favourites: prev.favourites.filter((t) => t.id !== trailId),
          wishlist: prev.wishlist.filter((t) => t.id !== trailId),
          completed: [...prev.completed, trail],
        };
      });

      closeReviewModal();
      alert("Trail marked as completed and review submitted!");

    } catch (err) {
      console.error("Failed to mark trail as completed and add review:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  // Render trail list for the current active tab
  const renderTrailList = () => {
    const trailArray = trails[activeTab] || [];
    const filteredTrails = filterTrails(trailArray);
    
    if (trailArray.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">
            {activeTab === 'favourites' && <Heart size={48} />}
            {activeTab === 'completed' && <CheckCircle size={48} />}
            {activeTab === 'wishlist' && <Bookmark size={48} />}
            {activeTab === 'submitted' && <Upload size={48} />}
            {!['favourites', 'completed', 'wishlist', 'submitted'].includes(activeTab) && <Mountain size={48} />}
          </div>
          <p>No trails in your {activeTab} yet.</p>
          <p className="empty-subtext">
            {activeTab === 'submitted' 
              ? 'Submit your first trail to see it here!' 
              : 'Start exploring to add trails to your collection!'
            }
          </p>
        </div>
      );
    }

    if (filteredTrails.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">
            <Mountain size={48} />
          </div>
          <p>No trails match your current filters.</p>
          <p className="empty-subtext">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      );
    }
    
    return filteredTrails.map((trail) => (
      <TrailCard
        key={trail.id}
        trail={trail}
        activeTab={activeTab}
        alerts={alerts}
        loadingStates={loadingStates}
        trails={trails}
        onShowAlertsPopup={showAlertsPopup}
        onHideAlertsPopup={hideAlertsPopup}
        onOpenStatusConfirmModal={openStatusConfirmModal}
        onOpenReviewModal={openReviewModal}
      />
    ));
  };

  return (
    <div className="my-trails-container">
      <header className="page-header">
        <h1>My Trails</h1>
      </header>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your trails...</p>
          <div className="loading-progress">
            {loadingStates.savedTrails && <span>Loading saved trails...</span>}
            {loadingStates.submittedTrails && <span>Loading submitted trails...</span>}
            {loadingStates.alerts && <span>Loading alerts...</span>}
          </div>
        </div>
      ) : (
        <>
          <div className="tabs-scroll-container">
            <div className="tabs-container">
              <button 
                className={`tab ${activeTab === 'favourites' ? 'active' : ''}`}
                onClick={() => setActiveTab('favourites')}
              >
                <span className="tab-icon"><Heart size={18} /></span>
                <span className="tab-text">Favourites</span>
                <span className="tab-count">{trails.favourites?.length || 0}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                <span className="tab-icon"><CheckCircle size={18} /></span>
                <span className="tab-text">Completed</span>
                <span className="tab-count">{trails.completed?.length || 0}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'wishlist' ? 'active' : ''}`}
                onClick={() => setActiveTab('wishlist')}
              >
                <span className="tab-icon"><Bookmark size={18} /></span>
                <span className="tab-text">Wishlist</span>
                <span className="tab-count">{trails.wishlist?.length || 0}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'submitted' ? 'active' : ''}`}
                onClick={() => setActiveTab('submitted')}
              >
                <span className="tab-icon"><Upload size={18} /></span>
                <span className="tab-text">Submitted</span>
                <span className="tab-count">{trails.submitted?.length || 0}</span>
              </button>
            </div>
          </div>

          {/* Filter and Search */}
          <MyTrailsFilter
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            activeTab={activeTab}
          />

          <div className="trails-content">
            <div className="active-tab-header">
              <h2>
                {activeTab === 'favourites' && (
                  <>
                    <Heart size={20} style={{ marginRight: '8px', display: 'inline-block' }} />
                    Favourite Trails
                  </>
                )}
                {activeTab === 'completed' && (
                  <>
                    <CheckCircle size={20} style={{ marginRight: '8px', display: 'inline-block' }} />
                    Completed Trails
                  </>
                )}
                {activeTab === 'wishlist' && (
                  <>
                    <Bookmark size={20} style={{ marginRight: '8px', display: 'inline-block' }} />
                    Wishlist Trails
                  </>
                )}
                {activeTab === 'submitted' && (
                  <>
                    <Upload size={20} style={{ marginRight: '8px', display: 'inline-block' }} />
                    Submitted Trails
                  </>
                )}
              </h2>
              <span className="trail-count">
                {(() => {
                  const trailArray = trails[activeTab] || [];
                  const filteredTrails = filterTrails(trailArray);
                  return filteredTrails.length;
                })()} trails
              </span>
            </div>
            
            <ul className="trails-list">
              {renderTrailList()}
            </ul>
          </div>
        </>
      )}

      <ReviewModal
        trailName={modalState.trailName}
        isOpen={modalState.isOpen}
        onClose={closeReviewModal}
        onSubmit={handleMarkAsCompleted}
      />

      <StatusConfirmModal
        isOpen={statusConfirmState.isOpen}
        onClose={closeStatusConfirmModal}
        onConfirm={handleStatusChange}
        trailName={statusConfirmState.trailName}
        currentStatus={statusConfirmState.currentStatus}
      />

      <AlertsPopup
        isVisible={alertsPopup.isVisible}
        position={alertsPopup.position}
        alerts={alertsPopup.alerts}
        onMouseLeave={hideAlertsPopup}
      />
    </div>
  );
}
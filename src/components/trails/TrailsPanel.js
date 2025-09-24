import React, { useState, useMemo, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Heart, Bookmark, Check, Filter, FilterX, X, ChevronUp, ChevronDown, Edit3 } from 'lucide-react';
import { useToast } from '../ToastContext';
import { getDifficultyColor, getDifficultyIcon, calculateDistance } from './TrailUtils';
import './TrailsPanel.css';

const TrailsPanel = ({
  isPanelOpen,
  setIsPanelOpen,
  filteredTrails,
  showFilters,
  setShowFilters,
  setShowSubmissionPanel,
  userSaved,
  handleTrailAction,
  currentUserId,
  onTrailClick,
  selectedTrail,
  setSelectedTrail,
  userLocation,
  onEditTrail
}) => {
  const [sortBy, setSortBy] = useState('distanceAway');
  const [sortOrder, setSortOrder] = useState('asc');
  const trailsListRef = useRef(null);
  const selectedTrailRef = useRef(null);
  const [authorNames, setAuthorNames] = useState({});
  const { show: showToast } = useToast();

  // Sort trails based on selected criteria
  const sortedTrails = useMemo(() => {
    const validTrails = filteredTrails.filter(trail => 
      trail.longitude && 
      trail.latitude && 
      !isNaN(trail.longitude) && 
      !isNaN(trail.latitude) &&
      typeof trail.longitude === 'number' &&
      typeof trail.latitude === 'number'
    );

    return [...validTrails].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'distance':
          aValue = parseFloat(a.distance) || 0;
          bValue = parseFloat(b.distance) || 0;
          break;
        case 'distanceAway':
          // Calculate distance from user's location to trail
          if (userLocation) {
            aValue = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              a.latitude,
              a.longitude
            );
            bValue = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              b.latitude,
              b.longitude
            );
          } else {
            aValue = 0;
            bValue = 0;
          }
          break;
        case 'difficulty':
          const difficultyOrder = { 'easy': 1, 'moderate': 2, 'hard': 3, 'difficult': 3, 'expert': 4 };
          aValue = difficultyOrder[a.difficulty?.toLowerCase()] || 0;
          bValue = difficultyOrder[b.difficulty?.toLowerCase()] || 0;
          break;
        case 'elevation':
          aValue = parseFloat(a.elevationGain) || 0;
          bValue = parseFloat(b.elevationGain) || 0;
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
  }, [filteredTrails, sortBy, sortOrder, userLocation]);

  // Scroll to selected trail when it changes
  useEffect(() => {
    if (selectedTrail && selectedTrailRef.current && trailsListRef.current) {
      // Small delay to ensure the DOM has updated
      setTimeout(() => {
        selectedTrailRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 100);
    }
  }, [selectedTrail]);

  // Handle scroll events to unselect trail
  useEffect(() => {
    const trailsList = trailsListRef.current;
    if (!trailsList) return;

    let scrollTimeout;
    const handleScroll = () => {
      // Clear any existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Set a new timeout to unselect after scrolling stops
      scrollTimeout = setTimeout(() => {
        if (selectedTrail) {
          setSelectedTrail(null);
        }
      }, 150); // 150ms delay to avoid unselecting during programmatic scroll
    };

    trailsList.addEventListener('scroll', handleScroll);
    
    return () => {
      trailsList.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [selectedTrail, setSelectedTrail]);

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  // Resolve and cache author display names for visible trails
  useEffect(() => {
    const fetchMissingAuthors = async () => {
      try {
        const idsToFetch = new Set();
        for (const trail of filteredTrails) {
          const createdByRaw = trail.createdBy;
          if (!createdByRaw) continue;
          const uid = typeof createdByRaw === 'string'
            ? (createdByRaw.includes('/') ? createdByRaw.split('/').pop() : createdByRaw)
            : createdByRaw;
          if (!uid || uid === 'sample' || uid === 'unknown') continue;
          if (!authorNames[uid]) idsToFetch.add(uid);
        }

        if (idsToFetch.size === 0) return;

        const entries = await Promise.all(Array.from(idsToFetch).map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, 'Users', uid));
            if (snap.exists()) {
              const data = snap.data();
              const name = data?.profileInfo?.displayName || data?.profileInfo?.name || data?.name || 'Unknown';
              return [uid, name];
            }
            return [uid, 'Unknown'];
          } catch (e) {
            return [uid, 'Unknown'];
          }
        }));

        if (entries.length > 0) {
          setAuthorNames(prev => ({ ...prev, ...Object.fromEntries(entries) }));
        }
      } catch (e) {
        // swallow errors; UI will just show Unknown
      }
    };

    fetchMissingAuthors();
  }, [filteredTrails, authorNames]);

  return (
    <div className={`trails-panel-toggle ${isPanelOpen ? 'open' : ''}`}>
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className="trails-toggle-btn"
        title={isPanelOpen ? "Close Trails Panel" : "Open Trails Panel"}
      >
        {isPanelOpen ? (
          <X size={20} />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        )}
      </button>

      {isPanelOpen && (
        <div className="trails-panel-content">
          <div className="trails-panel-header">
            <div className="header-top">
              <h2>Trails</h2>
              <div className="trails-count">
                {filteredTrails.length} trail{filteredTrails.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="header-actions">
              <div className="sort-dropdown">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="sort-select"
                >
                  <option value="distanceAway">Near Me</option>
                  <option value="name">Name</option>
                  <option value="distance">Distance</option>
                  <option value="difficulty">Difficulty</option>
                  <option value="elevation">Elevation</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="sort-order-btn"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="action-button secondary"
                title={showFilters ? "Hide Filters" : "Show Filters"}
              >
                {showFilters ? <FilterX size={16} /> : <Filter size={16} />}
              </button>
              {currentUserId && (
                <button
                  onClick={() => setShowSubmissionPanel(true)}
                  className="action-button primary"
                  title="Submit New Trail"
                >
                  Submit Trail
                </button>
              )}
            </div>
          </div>

          <div className="trails-list" ref={trailsListRef}>
            {filteredTrails.length === 0 ? (
              <div className="no-trails">
                <p>No trails found matching your criteria.</p>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="action-button secondary"
                  title={showFilters ? "Hide Filters" : "Adjust Filters"}
                >
                  {showFilters ? <FilterX size={16} /> : <Filter size={16} />}
                  {showFilters ? "Hide" : "Adjust"}
                </button>
              </div>
            ) : (
              sortedTrails.map(trail => (
                  <div 
                    key={trail.id} 
                    ref={selectedTrail && selectedTrail.id === trail.id ? selectedTrailRef : null}
                    className={`trail-item ${selectedTrail && selectedTrail.id === trail.id ? 'selected' : ''}`}
                    onClick={() => {
                      if (selectedTrail && selectedTrail.id === trail.id) {
                        setSelectedTrail(null);
                      } else {
                        setSelectedTrail(trail);
                        onTrailClick && onTrailClick(trail);
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="trail-image-container">
                      {trail.photos && trail.photos.length > 0 ? (
                        <img
                          className="trail-thumb"
                          src={trail.photos[0]}
                          alt={`Photo of ${trail.name}`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="trail-thumb placeholder" aria-label="No photo available" />
                      )}
                      
                      <div className="trail-actions-overlay" onClick={(e) => e.stopPropagation()}>
                        {currentUserId && (
                          <>
                            <button
                              onClick={() => handleTrailAction(trail.id, 'favourites')}
                              className={`action-btn favourites ${userSaved.favourites.includes(trail.id) ? 'active' : ''}`}
                              title={userSaved.favourites.includes(trail.id) ? "Remove from Favourites" : "Add to Favourites"}
                            >
                              <Heart size={16} />
                            </button>
                            <button
                              onClick={() => handleTrailAction(trail.id, 'wishlist')}
                              className={`action-btn wishlist ${userSaved.wishlist.includes(trail.id) ? 'active' : ''}`}
                              title={userSaved.wishlist.includes(trail.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                            >
                              <Bookmark size={16} />
                            </button>
                            <button
                              onClick={() => handleTrailAction(trail.id, 'completed')}
                              className={`action-btn completed ${userSaved.completed.includes(trail.id) ? 'active' : ''}`}
                              title={userSaved.completed.includes(trail.id) ? "Remove from Completed" : "Mark as Completed"}
                            >
                              <Check size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="trail-item-content">
                      <div className="trail-item-header">
                        <h3>{trail.name}</h3>
                        <div className="trail-author" title="Trail submitted by">
                          {(() => {
                            const createdByRaw = trail.createdBy;
                            if (!createdByRaw) {
                              return null;
                            }
                            const uid = typeof createdByRaw === 'string'
                              ? (createdByRaw.includes('/') ? createdByRaw.split('/').pop() : createdByRaw)
                              : createdByRaw;
                            const display = uid === 'sample' ? 'Sample User' : (uid === 'unknown' ? 'Unknown' : (authorNames[uid] || '...'));
                            return <span>by {display}</span>;
                          })()}
                        </div>
                      </div>
                      <div className="trail-item-details">
                        <div className="trail-difficulty" style={{ backgroundColor: getDifficultyColor(trail.difficulty) }}>
                          <span className="trail-difficulty-icon">
                            {getDifficultyIcon(trail.difficulty)}
                          </span>
                          {trail.difficulty}
                        </div>
                        <div className="trail-item-distance">
                          {trail.distance} km
                          {trail.elevationGain && ` • ${trail.elevationGain}m elevation `}
                          {userLocation && (
                            <span className="trail-distance-away">
                              • {calculateDistance(
                                userLocation.latitude,
                                userLocation.longitude,
                                trail.latitude,
                                trail.longitude
                              ).toFixed(1)} km away
                            </span>
                          )}
                        </div>
                      </div>
                      {trail.tags && trail.tags.length > 0 && (
                        <div className="trail-item-tags">
                          {trail.tags.map((tag, index) => (
                            <span key={index} className="trail-tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {(() => {
                      const createdByRaw = trail.createdBy;
                      if (!createdByRaw || !currentUserId) return null;
                      const uid = typeof createdByRaw === 'string'
                        ? (createdByRaw.includes('/') ? createdByRaw.split('/').pop() : createdByRaw)
                        : createdByRaw;
                      if (uid !== currentUserId) return null;
                      return (
                        <button
                          className="edit-trail-btn"
                          title={`Edit ${trail.name}`}
                          aria-label={`Edit ${trail.name}`}
                          onClick={(e) => { e.stopPropagation(); onEditTrail(trail); }}
                        >
                          <Edit3 size={14} />
                        </button>
                      );
                    })()}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrailsPanel;

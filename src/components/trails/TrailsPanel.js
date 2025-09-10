import React, { useState, useMemo } from 'react';
import { Heart, Bookmark, CheckCircle2, Filter, FilterX, X, ChevronUp, ChevronDown } from 'lucide-react';
import { getDifficultyColor, getDifficultyIcon } from './TrailUtils';
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
  currentUserId
}) => {
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

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
  }, [filteredTrails, sortBy, sortOrder]);

  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

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
              <button
                onClick={() => setShowSubmissionPanel(true)}
                className="action-button primary"
                title="Submit New Trail"
              >
                Submit Trail
              </button>
            </div>
          </div>

          <div className="trails-list">
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
                  <div key={trail.id} className="trail-item">
                    <div className="trail-item-header">
                      <h3>{trail.name}</h3>
                      <div className="trail-actions">
                        {currentUserId && (
                          <>
                            <button
                              onClick={() => handleTrailAction(trail.id, 'favourites')}
                              className={`action-btn ${userSaved.favourites.includes(trail.id) ? 'active' : ''}`}
                              title={userSaved.favourites.includes(trail.id) ? "Remove from Favourites" : "Add to Favourites"}
                            >
                              <Heart size={16} fill={userSaved.favourites.includes(trail.id) ? "currentColor" : "none"} />
                            </button>
                            <button
                              onClick={() => handleTrailAction(trail.id, 'wishlist')}
                              className={`action-btn ${userSaved.wishlist.includes(trail.id) ? 'active' : ''}`}
                              title={userSaved.wishlist.includes(trail.id) ? "Remove from Wishlist" : "Add to Wishlist"}
                            >
                              <Bookmark size={16} fill={userSaved.wishlist.includes(trail.id) ? "currentColor" : "none"} />
                            </button>
                            <button
                              onClick={() => handleTrailAction(trail.id, 'completed')}
                              className={`action-btn ${userSaved.completed.includes(trail.id) ? 'active' : ''}`}
                              title={userSaved.completed.includes(trail.id) ? "Remove from Completed" : "Mark as Completed"}
                            >
                              <CheckCircle2 size={16} fill={userSaved.completed.includes(trail.id) ? "currentColor" : "none"} />
                            </button>
                          </>
                        )}
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
                        {trail.elevationGain && ` • ${trail.elevationGain}m elevation`}
                      </div>
                    </div>
                    {trail.description && (
                      <p className="trail-description">{trail.description}</p>
                    )}
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
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrailsPanel;

import React, { useEffect, useState } from 'react';
import { Trophy, Award, Star, Target, Clock, MapPin, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchBadges, getBadgesByCategory } from '../utils/badgesApi';
import PyramidLoader from '../components/PyramidLoader';
import './AchievementsPage.css';

const AchievementsPage = () => {
  const [badgesData, setBadgesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();

  const loadBadges = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBadges();
      setBadgesData(data);
    } catch (err) {
      console.error('Error loading badges:', err);
      setError('Unable to load achievements. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadBadges();
  };

  const getBadgeIcon = (badgeName) => {
    const iconMap = {
      'First Steps': <Trophy className="badge-icon-large" />,
      'Distance Walker': <MapPin className="badge-icon-large" />,
      'Peak Collector': <Star className="badge-icon-large" />,
      'Early Bird': <Clock className="badge-icon-large" />,
      'Endurance Master': <Target className="badge-icon-large" />,
      'Trail Explorer': <Award className="badge-icon-large" />
    };
    return iconMap[badgeName] || <Award className="badge-icon-large" />;
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'standard': '#4CAF50',
      'intermediate': '#FF9800',
      'advanced': '#F44336',
      'expert': '#9C27B0'
    };
    return colors[difficulty] || '#4CAF50';
  };

  if (loading) {
    return (
      <div className="achievements-page">
        <PyramidLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="achievements-page">
        <div className="achievements-header">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            <ArrowLeft /> Back to Profile
          </button>
          <h1>Achievements</h1>
        </div>
        <div className="error-container">
          <div className="error-content">
            <AlertCircle className="error-icon" />
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button className="retry-btn" onClick={handleRetry} disabled={loading}>
                <RefreshCw className={loading ? 'spinning' : ''} />
                {loading ? 'Retrying...' : 'Try Again'}
              </button>
              <button className="back-to-profile-btn" onClick={() => navigate('/profile')}>
                Back to Profile
              </button>
            </div>
            {retryCount > 0 && (
              <p className="retry-count">Attempt {retryCount + 1}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!badgesData) {
    return (
      <div className="achievements-page">
        <div className="achievements-header">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            <ArrowLeft /> Back to Profile
          </button>
          <h1>Achievements</h1>
        </div>
        <div className="no-data">No achievements data available</div>
      </div>
    );
  }

  const achievementBadges = getBadgesByCategory(badgesData.badges, 'achievement');

  return (
    <div className="achievements-page">
      <div className="achievements-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          <ArrowLeft /> Back to Profile
        </button>
        <h1>Achievements</h1>
      </div>

      <div className="achievements-stats">
        <div className="stat-card">
          <h3>{badgesData.totalBadges}</h3>
          <p>Total Badges</p>
        </div>
        <div className="stat-card">
          <h3>{badgesData.categories.length}</h3>
          <p>Categories</p>
        </div>
      </div>

      {badgesData.note && (
        <div className="achievements-note">
          <p>{badgesData.note}</p>
        </div>
      )}

      <div className="achievements-content">
        <h2>Achievement Badges</h2>
        <div className="badges-grid-full">
          {achievementBadges.map((badge, index) => (
            <div key={index} className="achievement-card">
              <div className="badge-icon-container-large">
                {getBadgeIcon(badge.name)}
              </div>
              <div className="achievement-info">
                <h3>{badge.name}</h3>
                <p className="achievement-description">{badge.description}</p>
                <div className="achievement-meta">
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(badge.difficulty) }}
                  >
                    {badge.difficulty}
                  </span>
                  <span className="category-badge">{badge.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;

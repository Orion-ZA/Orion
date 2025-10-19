import React, { useEffect, useState } from 'react';
import { Trophy, Award, Star, Target, Clock, MapPin } from 'lucide-react';
import { fetchBadges } from '../utils/badgesApi';
import './BadgesSection.css';

const BadgesSection = ({ onViewAllClick }) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadBadges = async () => {
      try {
        const data = await fetchBadges();
        setBadges(data.badges.slice(0, 3)); // Show only first 3 badges in profile
        setError(null);
      } catch (err) {
        console.error('Error loading badges:', err);
        // Don't show error in profile - just show empty state
        setBadges([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    loadBadges();
  }, []);

  const getBadgeIcon = badgeName => {
    const iconMap = {
      'First Steps': <Trophy className='badge-icon' />,
      'Distance Walker': <MapPin className='badge-icon' />,
      'Peak Collector': <Star className='badge-icon' />,
      'Early Bird': <Clock className='badge-icon' />,
      'Endurance Master': <Target className='badge-icon' />,
      'Trail Explorer': <Award className='badge-icon' />,
    };
    return iconMap[badgeName] || <Award className='badge-icon' />;
  };

  if (loading) {
    return (
      <div className='badges-section'>
        <h2>
          <Trophy className='section-icon' /> Achievements
        </h2>
        <div className='badges-loading'>Loading badges...</div>
      </div>
    );
  }

  return (
    <div className='badges-section'>
      <div className='badges-header'>
        <h2>
          <Trophy className='section-icon' /> Achievements
        </h2>
        <button className='view-all-btn' onClick={onViewAllClick}>
          View All
        </button>
      </div>

      <div className='badges-grid'>
        {badges.map((badge, index) => (
          <div key={index} className='badge-card'>
            <div className='badge-icon-container'>{getBadgeIcon(badge.name)}</div>
            <div className='badge-info'>
              <h4>{badge.name}</h4>
              <p>{badge.description}</p>
            </div>
          </div>
        ))}
      </div>

      {badges.length === 0 && (
        <div className='no-badges'>
          <p>No achievements yet. Start hiking to earn badges!</p>
        </div>
      )}
    </div>
  );
};

export default BadgesSection;

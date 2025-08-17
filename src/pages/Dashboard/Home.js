import React from 'react';
import { Calendar, Heart, Bookmark, MapPin, Award } from 'lucide-react';
import '../Dashboard.css';

export default function Home({ userData, trailDetails }) {
  const today = new Date();
  const currentDate = today.getDate();
  const currentMonth = today.toLocaleDateString('en-US', { month: 'short' });
  const currentDay = today.toLocaleDateString('en-US', { weekday: 'short' });

  const generateCalendarDays = () => {
const days = [];
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - currentDayOfWeek);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      
      days.push({
        label: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][i],
        date: day.getDate(),
        isToday: day.getDate() === today.getDate() && day.getMonth() === today.getMonth()
      });
    }
    
    return days;  
};

  return (
    <div className="dashboard-content">
      {/* Mini Calendar - Mobile Only */}
      <div className="mini-calendar">
        <div className="calendar-header">
          <h3 className="calendar-title">This Week</h3>
          <Calendar size={16} className="calendar-icon" />
        </div>
        <div className="calendar-grid">
          {generateCalendarDays().map((day, index) => (
            <div key={index} className="calendar-day-container">
              <div className="calendar-day-label">{day.label}</div>
              <div className={`calendar-day ${day.isToday ? 'active' : ''}`}>
                {day.date}
              </div>
            </div>
          ))}
        </div>
      </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon completed">
                <Award size={20} />
              </div>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-number">
              {userData?.completedHikes?.length || 0}
            </div>
            <div className="stat-description">Completed Hikes</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon favourites">
                <Heart size={20} />
              </div>
              <span className="stat-label">Saved</span>
            </div>
            <div className="stat-number">
              {userData?.favourites?.length || 0}
            </div>
            <div className="stat-description">Favourites</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon wishlist">
                <Bookmark size={20} />
              </div>
              <span className="stat-label">Planned</span>
            </div>
            <div className="stat-number">
              {userData?.wishlist?.length || 0}
            </div>
            <div className="stat-description">Wishlist</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon submitted">
                <MapPin size={20} />
              </div>
              <span className="stat-label">Created</span>
            </div>
            <div className="stat-number">
              {userData?.submittedTrails?.length || 0}
            </div>
            <div className="stat-description">Submitted Trails</div>
          </div>
        </div>

        {/* Favourites Section */}
        <div className="favourites-section">
          <div className="favourites-header">
            <h2 className="favourites-title">Your Favourites</h2>
            <Heart className="favourites-icon" size={24} />
          </div>
          
          {trailDetails.favourites.length ? (
            <div className="favourites-list">
              {trailDetails.favourites.map((trail, i) => (
                <div key={i} className="favourite-item">
                  <div className="favourite-trail-icon">
                    <MapPin size={16} />
                  </div>
                  <div className="favourite-content">
                    <h3 className="favourite-name">{trail.name || 'Unnamed Trail'}</h3>
                    <p className="favourite-details">
                      Difficulty: {trail.difficulty || 'N/A'} • {trail.duration || 'N/A'}
                    </p>
                  </div>
                  <div className="favourite-heart">
                    <Heart size={12} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-favourites">
              <div className="empty-icon">
                <Heart size={24} />
              </div>
              <p className="empty-message">No favourites yet.</p>
              <p className="empty-submessage">Start exploring trails to add them to your favourites!</p>
            </div>
          )}
        </div>
      </div>
      );
}


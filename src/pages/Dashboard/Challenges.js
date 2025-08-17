import React from 'react';
import { Trophy, CheckCircle, Clock, Star } from 'lucide-react';
import '../Dashboard.css';

export default function Challenges({ userData }) {
  return (
    <div className="dashboard-content">
      <h2 className="challenges-title">Current Challenges</h2>
      
      <div className="challenges-grid">
        <div className="challenge-card active">
          <Trophy size={24} />
          <h3>Monthly Explorer</h3>
          <p>Complete 5 hikes this month</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: '60%' }}></div>
          </div>
          <span>3/5 completed</span>
        </div>
        
        <div className="challenge-card">
          <CheckCircle size={24} />
          <h3>Trail Blazer</h3>
          <p>Complete 3 different trails</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: '33%' }}></div>
          </div>
          <span>1/3 completed</span>
        </div>
      </div>
      
      <h2 className="achievements-title">Your Achievements</h2>
      <div className="achievements-grid">
        <div className="achievement-card">
          <Star size={20} />
          <p>First Hike</p>
        </div>
        {/* Add more achievements */}
      </div>
    </div>
  );
}
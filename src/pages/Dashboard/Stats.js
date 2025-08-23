import React from 'react';
import { BarChart, Activity, Mountain, Flag } from 'lucide-react';
import '../Dashboard.css';

export default function Stats({ userData }) {
  return (
    <div className="dashboard-content">
      <h2 className="stats-title">Your Hiking Statistics</h2>
      
      <div className="detailed-stats">
        <div className="stat-chart">
          <BarChart size={24} />
          <h3>Monthly Progress</h3>
          {/* Placeholder for chart */}
          <div className="chart-placeholder"></div>
        </div>
        
        <div className="stat-details">
          <div className="stat-detail-card">
            <Activity size={20} />
            <div>
              <h4>Total Distance</h4>
              <p>{userData?.stats?.totalDistance || 0} km</p>
            </div>
          </div>
          
          <div className="stat-detail-card">
            <Mountain size={20} />
            <div>
              <h4>Elevation Gain</h4>
              <p>{userData?.stats?.elevation || 0} m</p>
            </div>
          </div>
          
          <div className="stat-detail-card">
            <Flag size={20} />
            <div>
              <h4>Trails Completed</h4>
              <p>{userData?.completedHikes?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
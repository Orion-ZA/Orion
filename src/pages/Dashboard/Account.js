import React from 'react';
import { User, Mail, Calendar as CalendarIcon, LogOut } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import '../Dashboard.css';

export default function Account({ user, userData, handleLogout }) {
  // Safe date parsing with fallback
  const getJoinedDate = () => {
    if (userData?.profileInfo?.joinedDate instanceof Timestamp) {
        return userData.profileInfo.joinedDate.toDate().toLocaleDateString();
    }
    try {
      // Check if joinedDate exists and is valid
      if (!userData?.profileInfo?.joinedDate) return 'Unknown';
      
      // Handle both timestamp and ISO string formats
      const date = new Date(userData.profileInfo.joinedDate);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) return 'Unknown';
      
      // Return formatted date
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error parsing date:', error);
      return 'Unknown';
    }
  };

  return (
    <div className="dashboard-content">
      <div className="account-profile">
        <img 
          src={userData?.profileInfo?.avatar || user.photoURL || 'default-avatar'} 
          alt="Profile" 
          className="account-avatar"
        />
        <h2>{userData?.profileInfo?.name || 'User'}</h2>
        <p>{userData?.profileInfo?.email || user.email}</p>
      </div>
      
      <div className="account-details">
        <div className="account-detail">
          <User size={18} />
          <span>Username: {userData?.profileInfo?.name || 'Not set'}</span>
        </div>
        <div className="account-detail">
          <Mail size={18} />
          <span>Email: {user.email}</span>
        </div>
        <div className="account-detail">
          <CalendarIcon size={18} />
          <span>Member since: {getJoinedDate()}</span>
        </div>
      </div>
      
      <button onClick={handleLogout} className="logout-account-btn">
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </div>
  );
}
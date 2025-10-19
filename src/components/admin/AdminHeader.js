import React, { useState, useEffect } from 'react';
import { BarChart2, FileText, MapPin, Users, ArrowLeft, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AdminHeader.css';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'feedback', label: 'Feedback', icon: FileText },
  { id: 'trails', label: 'Trails', icon: MapPin },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'reports', label: 'Reports', icon: Flag },
];

export default function AdminHeader({ activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);

  const checkApiHealth = async () => {
    try {
      const response = await fetch('https://orion-api-qeyv.onrender.com/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        setApiStatus('online');
        setLastChecked(new Date());
      } else {
        setApiStatus('offline');
        setLastChecked(new Date());
      }
    } catch (error) {
      console.error('API health check failed:', error);
      setApiStatus('offline');
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    // Check API health on component mount
    checkApiHealth();

    // Set up periodic health checks every 30 seconds
    const interval = setInterval(checkApiHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleBackClick = () => {
    // Check if there's a previous page in history
    if (window.history.length > 1) {
      navigate(-1); // Go back to previous page
    } else {
      // Fallback to dashboard if no history
      navigate('/dashboard');
    }
  };

  return (
    <header className='admin-header'>
      <div className='admin-header-content'>
        <div className='admin-header-left'>
          <button onClick={handleBackClick} className='admin-back-button' title='Go back'>
            <ArrowLeft className='admin-back-icon' />
            <span className='admin-back-text'>Back</span>
          </button>
          <h1 className='admin-header-title'>Admin Dashboard</h1>
        </div>
        <div className='admin-header-tabs'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`admin-header-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              <tab.icon className='admin-header-tab-icon' />
              {tab.label}
            </button>
          ))}
        </div>
        <div className='admin-header-status'>
          <span className='admin-header-status-text'>
            API{' '}
            {apiStatus === 'online'
              ? 'Online'
              : apiStatus === 'offline'
                ? 'Offline'
                : 'Checking...'}
          </span>
          <span
            className={`admin-header-status-indicator ${
              apiStatus === 'online' ? 'online' : apiStatus === 'offline' ? 'offline' : 'checking'
            }`}
          />
        </div>
      </div>
    </header>
  );
}

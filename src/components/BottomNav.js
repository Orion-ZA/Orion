import React from 'react';
import { Home, BarChart, Trophy, User } from 'lucide-react';
import '../pages/Dashboard.css';

export default function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: <Home size={20} />,
      activeIcon: <Home size={20} fill="#4CAF50" />
    },
    { 
      id: 'stats', 
      label: 'Stats', 
      icon: <BarChart size={20} />,
      activeIcon: <BarChart size={20} fill="#4CAF50" />
    },
    { 
      id: 'challenges', 
      label: 'Challenges', 
      icon: <Trophy size={20} />,
      activeIcon: <Trophy size={20} fill="#4CAF50" />
    },
    { 
      id: 'account', 
      label: 'Account', 
      icon: <User size={20} />,
      activeIcon: <User size={20} fill="#4CAF50" />
    }
  ];

  return (
    <nav className="bottom-nav">
      <div className="nav-grid">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            aria-label={tab.label}
          >
            {activeTab === tab.id ? tab.activeIcon : tab.icon}
            <span className="nav-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
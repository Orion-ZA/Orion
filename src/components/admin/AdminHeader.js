import React from "react";
import { BarChart2, FileText, MapPin, Users, ArrowLeft, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./AdminHeader.css";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart2 },
  { id: "feedback", label: "Feedback", icon: FileText },
  { id: "trails", label: "Trails", icon: MapPin },
  { id: "users", label: "Users", icon: Users },
  { id: "reports", label: "Reports", icon: Flag },
];

export default function AdminHeader({ activeTab, setActiveTab }) {
  const navigate = useNavigate();

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
    <header className="admin-header">
      <div className="admin-header-content">
        <div className="admin-header-left">
          <button
            onClick={handleBackClick}
            className="admin-back-button"
            title="Go back"
          >
            <ArrowLeft className="admin-back-icon" />
            <span className="admin-back-text">Back</span>
          </button>
          <h1 className="admin-header-title">Admin Dashboard</h1>
        </div>
        <div className="admin-header-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`admin-header-tab ${activeTab === tab.id ? "active" : ""}`}
            >
              <tab.icon className="admin-header-tab-icon" />
              {tab.label}
            </button>
          ))}
        </div>
        <div className="admin-header-status">
          <span className="admin-header-status-text">You are online</span>
          <span className="admin-header-status-indicator" />
        </div>
      </div>
    </header>
  );
}

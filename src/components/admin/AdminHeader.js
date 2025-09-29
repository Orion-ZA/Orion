import React from "react";
import { BarChart2, FileText } from "lucide-react";
import "./AdminHeader.css";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart2 },
  { id: "feedback", label: "Feedback", icon: FileText },
];

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="admin-header">
      <div className="admin-header-content">
        <h1 className="admin-header-title">Admin Dashboard</h1>
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

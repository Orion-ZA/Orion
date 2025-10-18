import React from "react";
import FeedbackPanel from "./FeedbackPanel";
import RatingsChart from "./RatingsChart";
import FeedbackTypeChart from "./FeedbackTypeChart";
import TrailsManagement from "./TrailsManagement";
import UsersManagement from "./UsersManagement";
import ReportsManagement from "./ReportsManagement";
import "./AdminMainPanel.css";

export default function AdminMainPanel({ activeTab }) {
  return (
    <main className="admin-main-panel">
      {activeTab === "dashboard" && (
        <div className="admin-dashboard-container">
          {/* Analytics Section */}
          <div className="admin-section">
            <h2 className="admin-section-title">Analytics Overview</h2>
            <div className="admin-analytics-section">
              <RatingsChart />
              <FeedbackTypeChart />
            </div>
          </div>

          {/* Feedback Section */}
          <div className="admin-section">
            <h2 className="admin-section-title">Recent Feedback</h2>
            <div className="admin-feedback-section">
              <FeedbackPanel />
            </div>
          </div>
        </div>
      )}

      {activeTab === "feedback" && (
        <div className="admin-feedback-standalone">
          <FeedbackPanel />
        </div>
      )}

      {activeTab === "trails" && (
        <div className="admin-management-section">
          <TrailsManagement />
        </div>
      )}

      {activeTab === "users" && (
        <div className="admin-management-section">
          <UsersManagement />
        </div>
      )}

      {activeTab === "reports" && (
        <div className="admin-management-section">
          <ReportsManagement />
        </div>
      )}
    </main>
  );
}

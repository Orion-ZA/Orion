import React from "react";
import FeedbackPanel from "./FeedbackPanel";
import RatingsChart from "./RatingsChart";
import FeedbackTypeChart from "./FeedbackTypeChart";


export default function AdminMainPanel({ activeTab }) {
  return (
    <main className="flex-1 p-6 overflow-y-auto">
      {activeTab === "chats" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Active Chats</h2>
          <div className="p-4 bg-white shadow rounded-lg">
            <p>No active chats yet.</p>
          </div>
        </div>
      )}

      {activeTab === "feedback" && <FeedbackPanel />}

      {activeTab === "analytics" && (
        <div className="space-y-4">
            <RatingsChart />
            <FeedbackTypeChart />
        </div>
      )}

      {activeTab === "settings" && (
        <div>
          <h2 className="text-xl font-bold mb-4">Settings</h2>
          <div className="p-4 bg-white shadow rounded-lg">
            <p>Developer settings and availability toggle.</p>
          </div>
        </div>
      )}
    </main>
  );
}

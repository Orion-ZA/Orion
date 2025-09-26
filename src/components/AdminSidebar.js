import React from "react";
import { MessageSquare, FileText, BarChart2, Settings } from "lucide-react";

const tabs = [
  { id: "chats", label: "Chats", icon: MessageSquare },
  { id: "feedback", label: "Feedback", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <div className="w-60 bg-white border-r shadow-sm">
      <div className="p-4 font-bold text-lg">Dev Dashboard</div>
      <nav className="space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center px-4 py-2 text-left hover:bg-gray-100 transition
              ${activeTab === tab.id ? "bg-gray-200 font-medium" : ""}`}
          >
            <tab.icon className="w-5 h-5 mr-2" />
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

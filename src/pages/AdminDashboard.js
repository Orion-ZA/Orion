import React, { useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import AdminMainPanel from "../components/AdminMainPanel";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("chats");

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <AdminMainPanel activeTab={activeTab} />
      </div>
    </div>
  );
}

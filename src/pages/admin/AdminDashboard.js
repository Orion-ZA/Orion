import React, { useState, useEffect } from "react";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminMainPanel from "../../components/admin/AdminMainPanel";
import "./AdminDashboard.css";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    // Add class to body when admin dashboard mounts
    document.body.classList.add('admin-dashboard-active');

    // Cleanup: remove class when component unmounts
    return () => {
      document.body.classList.remove('admin-dashboard-active');
    };
  }, []);

  return (
    <div className="admin-dashboard">
      <AdminHeader activeTab={activeTab} setActiveTab={setActiveTab} />
      <AdminMainPanel activeTab={activeTab} />
    </div>
  );
}

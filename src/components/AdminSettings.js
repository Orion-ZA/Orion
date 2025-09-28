import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { useTheme } from './ThemeProvider';

export default function AdminSettings() {
  const user = auth.currentUser;
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    activityUpdates: true,
    newsletter: false,
    publicProfile: true,
    showActivityStatus: true,
    mapType: 'standard',
    theme: themeMode || 'auto'
  });

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = "/"; // redirect after logout
  };

  const handleThemeToggle = () => {
    const newTheme = preferences.theme === "dark" ? "light" : "dark";
    setPreferences(prev => ({
      ...prev,
      theme: newTheme
    }));
    setThemeMode(newTheme);
  };

  return (
    <div className="p-6">

      {/* Profile info */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium mb-2">Hi, {user?.displayName}</h2>
        <div className="flex items-center gap-4">
            <label>
                <input
                type="radio"
                name="theme"
                value="auto"
                checked={preferences.theme === "auto"}
                onChange={() => {
                    setPreferences(prev => ({ ...prev, theme: "auto" }));
                    setThemeMode("auto");
                }}
                className="mr-2"
                />
                Default
            </label>
            <label>
                <input
                type="radio"
                name="theme"
                value="light"
                checked={preferences.theme === "light"}
                onChange={() => {
                    setPreferences(prev => ({ ...prev, theme: "light" }));
                    setThemeMode("light");
                }}
                className="mr-2"
                />
                Light
            </label>
            <label>
                <input
                type="radio"
                name="theme"
                value="dark"
                checked={preferences.theme === "dark"}
                onChange={() => {
                    setPreferences(prev => ({ ...prev, theme: "dark" }));
                    setThemeMode("dark");
                }}
                className="mr-2"
                />
                Dark
            </label>
            </div>
      </div>

      {/* Account actions */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-medium mb-2">Account</h2>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

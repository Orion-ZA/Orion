import React from "react";

export default function Header() {
  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4 shadow-sm">
      <h1 className="text-lg font-semibold">Developer Dashboard</h1>
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-500">You are online</span>
        <span className="w-3 h-3 rounded-full bg-green-500" />
      </div>
    </header>
  );
}

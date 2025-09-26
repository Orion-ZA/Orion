import React, { useState } from "react";
import useFeedback from "./hooks/useFeedback";

export default function FeedbackPanel() {
  const { feedbacks, loading } = useFeedback();
  const [filter, setFilter] = useState("all");

  if (loading) return <p>Loading feedback...</p>;

  const filtered = filter === "all"
    ? feedbacks
    : feedbacks.filter((f) => f.type === filter);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">User Feedback</h2>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-4">
        {["all", "praise", "bug", "suggestion", "general"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1 rounded-md text-sm border ${
              filter === t ? "bg-blue-500 text-white" : "bg-white hover:bg-gray-100"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Feedback table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2 border">Message</th>
              <th className="p-2 border">Rating</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className="border-b">
                <td className="p-2 border">{f.message}</td>
                <td className="p-2 border">{f.rating ?? "-"}</td>
                <td className="p-2 border">
                  {f.contactAllowed ? f.email : "hidden"}
                </td>
                <td className="p-2 border">
                  {f.createdAt?.toDate().toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

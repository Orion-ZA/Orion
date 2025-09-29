import React, { useState } from "react";
import useFeedback from "./useFeedback";
import "./FeedbackPanel.css";

export default function FeedbackPanel() {
  const { feedbacks, loading } = useFeedback();
  const [filter, setFilter] = useState("all");

  if (loading) return <p>Loading feedback...</p>;

  const filtered = filter === "all"
    ? feedbacks
    : feedbacks.filter((f) => f.type === filter);

  return (
    <div className="feedback-panel">
      <h2 className="feedback-panel-title">User Feedback</h2>

      {/* Filter buttons */}
      <div className="feedback-filter-buttons">
        {["all", "praise", "bug", "suggestion", "general"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`feedback-filter-button ${filter === t ? "active" : ""}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Feedback table */}
      <div className="feedback-table-container">
        <table className="feedback-table">
          <thead className="feedback-table-header">
            <tr>
              <th>Message</th>
              <th>Rating</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className="feedback-table-row">
                <td className="feedback-table-cell">{f.message}</td>
                <td className="feedback-table-cell">{f.rating ?? "-"}</td>
                <td className="feedback-table-cell">
                  {f.contactAllowed ? f.email : "hidden"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
